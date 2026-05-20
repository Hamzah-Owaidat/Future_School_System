'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { splitSqlStatements, shouldIgnoreMysqlError } = require('./sqlStatements');

const MIGRATIONS_TABLE = 'migrations';

function getDbConfig(overrides = {}) {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: false,
    ...overrides
  };
}

async function ensureDatabaseExists() {
  const dbName = process.env.DB_NAME || 'futurschool';
  const conn = await mysql.createConnection(getDbConfig());

  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.end();

  return mysql.createConnection(getDbConfig({ database: dbName }));
}

async function ensureMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`migrations\` (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      migration VARCHAR(255) NOT NULL,
      batch INT UNSIGNED NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY migrations_migration_unique (migration)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function runStatements(connection, sqlText, { silent } = {}) {
  const stmts = splitSqlStatements(sqlText);
  for (const stmt of stmts) {
    try {
      await connection.query(stmt);
    } catch (err) {
      const errno = Number(err.errno);
      if (shouldIgnoreMysqlError(errno, stmt)) {
        if (!silent) {
          console.warn(
            `  ⦿ skipped (${errno}): ${stmt.slice(0, 100)}${stmt.length > 100 ? '…' : ''}`
          );
        }
        continue;
      }
      console.error('\n❌ Migration statement failed:', stmt.slice(0, 400));
      throw err;
    }
  }
}

function migrationsDir() {
  return path.join(__dirname, '..', 'database', 'migrations');
}

function listUpMigrationFiles() {
  const dir = migrationsDir();
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql'))
    .sort();
}

function downPathFor(upFileName) {
  const base = upFileName.replace(/\.sql$/i, '');
  return path.join(migrationsDir(), `${base}.down.sql`);
}

async function getRanMigrations(connection) {
  const [rows] = await connection.query(
    `SELECT migration FROM \`${MIGRATIONS_TABLE}\` ORDER BY id ASC`
  );
  return rows.map((r) => r.migration);
}

async function insertMigration(connection, name, batch) {
  await connection.query(`INSERT INTO \`${MIGRATIONS_TABLE}\` (migration, batch) VALUES (?, ?)`, [
    name,
    batch
  ]);
}

async function nextBatch(connection) {
  const [rows] = await connection.query(
    `SELECT COALESCE(MAX(batch), 0) + 1 AS next_batch FROM \`${MIGRATIONS_TABLE}\``
  );
  return rows[0].next_batch;
}

async function runPendingMigrations() {
  const connection = await ensureDatabaseExists();

  try {
    const files = listUpMigrationFiles();
    if (files.length === 0) {
      console.log(`No migrations found in:\n  ${migrationsDir()}`);
      return;
    }

    await ensureMigrationsTable(connection);
    const ran = await getRanMigrations(connection);
    const pending = files.filter((f) => !ran.includes(f));

    if (pending.length === 0) {
      console.log('✓ Nothing to migrate — database schema is already up to date.');
      return;
    }

    const batch = await nextBatch(connection);

    console.log(`→ Migrating batch ${batch} (${pending.length} file(s))\n`);

    for (const fileName of pending) {
      const filePath = path.join(migrationsDir(), fileName);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`  ▸ ${fileName}`);
      await runStatements(connection, sql);
      await insertMigration(connection, fileName, batch);
    }

    console.log('\n✓ Migrations finished.\n');
  } finally {
    await connection.end();
  }
}

async function printStatus() {
  const dbName = process.env.DB_NAME || 'futurschool';
  const connection = await ensureDatabaseExists();
  try {
    await ensureMigrationsTable(connection);
    const ran = await getRanMigrations(connection);

    const all = listUpMigrationFiles();
    console.log(`Database: ${dbName}`);
    console.log('');
    console.log(`Applied (${ran.length}):`);
    ran.forEach((m) => console.log(`  ✓ ${m}`));
    console.log('');
    const pending = all.filter((f) => !ran.includes(f));
    console.log(`Pending (${pending.length}):`);
    pending.forEach((m) => console.log(`  · ${m}`));
    console.log('');
  } finally {
    await connection.end();
  }
}

async function runFresh() {
  const dbName = process.env.DB_NAME || 'futurschool';

  console.warn(
    `\n⚠️  migrate:fresh — DROP DATABASE "${dbName}", then reapplies all migrations from scratch.\n`
  );

  const bare = await mysql.createConnection(getDbConfig());

  await bare.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
  await bare.query(
    `CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await bare.end();

  const conn = await mysql.createConnection(getDbConfig({ database: dbName }));
  try {
    await ensureMigrationsTable(conn);
    const files = listUpMigrationFiles().sort();

    console.log(`→ Fresh install (${files.length} migration file(s))\n`);

    const batchNum = 1;

    for (const fileName of files) {
      const sql = fs.readFileSync(path.join(migrationsDir(), fileName), 'utf8');
      console.log(`  ▸ ${fileName}`);
      await runStatements(conn, sql);
      await insertMigration(conn, fileName, batchNum);
    }

    console.log('\n✓ Fresh migrations finished.\n');
  } finally {
    await conn.end();
  }
}

async function rollbackLastBatch() {
  const connection = await ensureDatabaseExists();

  try {
    let rows;
    try {
      const [r] = await connection.query(`SELECT MAX(batch) AS b FROM \`${MIGRATIONS_TABLE}\``);
      rows = r;
    } catch (e) {
      if (e.errno === 1146) {
        console.log('Migrations table does not exist — nothing to roll back.');
        return;
      }
      throw e;
    }

    const lastBatch = rows[0]?.b ?? null;

    if (lastBatch == null || lastBatch < 1) {
      console.log('Nothing to roll back.');
      return;
    }

    const [inBatch] = await connection.query(
      `SELECT migration FROM \`${MIGRATIONS_TABLE}\` WHERE batch = ? ORDER BY id DESC`,
      [lastBatch]
    );

    if (inBatch.length === 0) {
      console.log('Nothing to roll back.');
      return;
    }

    console.log(`→ Rolling back batch ${lastBatch}\n`);

    for (const row of inBatch) {
      const migrationName = row.migration;
      const downFile = downPathFor(migrationName);

      if (!fs.existsSync(downFile)) {
        console.warn(`⚠ Missing down file for "${migrationName}".`);
        console.warn(`   Expected: ${path.basename(downFile)}`);
        throw new Error(
          'Rollback aborted — add the matching *.down.sql or roll back manually in MySQL.'
        );
      }

      const sql = fs.readFileSync(downFile, 'utf8');

      console.log(`  ◂ ${migrationName}`);
      await runStatements(connection, sql);
      await connection.query(`DELETE FROM \`${MIGRATIONS_TABLE}\` WHERE migration = ?`, [
        migrationName
      ]);
    }

    console.log('\n✓ Rollback finished.\n');
  } finally {
    await connection.end();
  }
}

module.exports = {
  ensureDatabaseExists,
  ensureMigrationsTable,
  runStatements,
  migrationsDir,
  listUpMigrationFiles,
  runPendingMigrations,
  printStatus,
  runFresh,
  rollbackLastBatch
};
