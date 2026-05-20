/**
 * Script to run database schema SQL file
 * 
 * Usage: node scripts/run-schema.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runSchema() {
  let connection;
  try {
    console.log('🏗️  Creating database schema...\n');

    // Create connection with multipleStatements enabled
    // First connect without specifying database (to create it if needed)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL server\n');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'database', 'schema.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the entire SQL file
    console.log('📝 Executing schema...\n');
    await connection.query(sql);
    
    console.log('✅ Database schema created successfully!\n');
  } catch (error) {
    console.error('❌ Error creating schema:', error.message);
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
runSchema().then(() => {
  process.exit(0);
});

