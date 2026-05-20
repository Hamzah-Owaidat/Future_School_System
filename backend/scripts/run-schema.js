/**
 * Loads pending SQL migrations (same as `npm run migrate`).
 *
 * Usage: node scripts/run-schema.js
 */

require('dotenv').config();
const { runPendingMigrations } = require('../lib/migrateRunner');

runPendingMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
