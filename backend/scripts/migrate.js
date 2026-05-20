'use strict';

/**
 * Laravel-style database migrations for MySQL.
 *
 * Usage (from backend/ directory):
 *   node scripts/migrate.js              Pending migrations only
 *   node scripts/migrate.js status       Show applied vs pending
 *   node scripts/migrate.js fresh        DROP DATABASE → recreate → all migrations
 *   node scripts/migrate.js rollback     Undo the last batch (requires *.down.sql)
 */

require('dotenv').config();

const {
  runPendingMigrations,
  printStatus,
  runFresh,
  rollbackLastBatch
} = require('../lib/migrateRunner');

const cmd = (process.argv[2] || 'up').toLowerCase();

async function main() {
  try {
    if (cmd === 'up' || cmd === 'migrate') {
      await runPendingMigrations();
    } else if (cmd === 'status') {
      await printStatus();
    } else if (cmd === 'fresh') {
      await runFresh();
    } else if (cmd === 'rollback') {
      await rollbackLastBatch();
    } else {
      console.log(`Unknown command: ${cmd}\n`);
      console.log('Commands: (default) up | status | fresh | rollback');
      process.exit(1);
    }
  } catch (e) {
    console.error('\n❌', e.message || e);
    process.exit(1);
  }
}

main();
