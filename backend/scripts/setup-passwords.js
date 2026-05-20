/**
 * Set bcrypt password on `users.password_hash` for employees who lack one.
 *
 * Usage: node scripts/setup-passwords.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const DEFAULT_PASSWORD = 'password1234'; // Change this before running in production!

async function setupPasswords() {
  try {
    console.log('🔐 Applying default password to employee accounts without passwords...\n');

    const users = await query(
      `SELECT u.id, u.email, e.first_name, e.last_name
       FROM users u
       INNER JOIN employees e ON e.user_id = u.id AND e.deleted_at IS NULL
       WHERE u.user_type = 'employee'
         AND u.is_active = TRUE
         AND (u.password_hash IS NULL OR TRIM(IFNULL(u.password_hash, '')) = '')`
    );

    if (users.length === 0) {
      console.log('✅ Every active employee login already has a password hash.');
      return;
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    for (const urow of users) {
      await query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, urow.id]);
      console.log(`✅ ${urow.first_name} ${urow.last_name} (${urow.email})`);
    }

    console.log(`\n✅ Done — ${users.length} user(s). Default password until changed: "${DEFAULT_PASSWORD}"\n`);
  } catch (error) {
    console.error('❌ Error setting up passwords:', error);
    process.exit(1);
  }
}

setupPasswords().then(() => process.exit(0));
