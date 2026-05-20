/**
 * Script to set initial passwords for employees
 * Run this after adding the password column to employees table
 * 
 * Usage: node scripts/setup-passwords.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const DEFAULT_PASSWORD = 'password1234'; // Change this in production!

async function setupPasswords() {
  try {
    console.log('🔐 Setting up initial passwords for employees...\n');

    // Get all employees without passwords
    const employees = await query(
      'SELECT id, email, employee_code, first_name, last_name FROM employees WHERE password IS NULL OR password = ""'
    );

    if (employees.length === 0) {
      console.log('✅ All employees already have passwords set.');
      return;
    }

    console.log(`Found ${employees.length} employees without passwords.\n`);

    // Hash the default password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Update each employee with the hashed password
    for (const employee of employees) {
      await query(
        'UPDATE employees SET password = ? WHERE id = ?',
        [hashedPassword, employee.id]
      );
      console.log(`✅ Password set for: ${employee.first_name} ${employee.last_name} (${employee.email})`);
    }

    console.log(`\n✅ Successfully set passwords for ${employees.length} employees.`);
    console.log(`⚠️  Default password: "${DEFAULT_PASSWORD}"`);
    console.log('⚠️  Please change these passwords after first login!\n');
  } catch (error) {
    console.error('❌ Error setting up passwords:', error);
    process.exit(1);
  }
}

// Run the script
setupPasswords().then(() => {
  process.exit(0);
});

