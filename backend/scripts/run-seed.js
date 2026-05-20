/**
 * Script to run seed data SQL file
 * 
 * Usage: node scripts/run-seed.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runSeed() {
  let connection;
  try {
    console.log('🌱 Running seed data...\n');

    // Create connection with multipleStatements enabled
    // Don't specify database - let the SQL file's USE statement handle it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true // Enable multiple statements
    });

    console.log('✅ Connected to database\n');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'database', 'seed_data.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the entire SQL file
    console.log('📝 Executing seed data...\n');
    const [results] = await connection.query(sql);
    
    console.log('✅ Seed data executed successfully!');
    console.log('💡 Next step: Run "node scripts/setup-passwords.js" to set admin password\n');
  } catch (error) {
    console.error('❌ Error running seed data:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql.substring(0, 200) + '...');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
runSeed().then(() => {
  process.exit(0);
});

