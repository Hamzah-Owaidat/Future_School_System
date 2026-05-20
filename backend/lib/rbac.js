'use strict';

const { query } = require('../config/database');

/**
 * Load permission codes granted to a user via user_roles → role_permissions.
 */
async function loadPermissionCodesForUser(userId) {
  const rows = await query(
    `SELECT DISTINCT p.code
     FROM permissions p
     INNER JOIN role_permissions rp ON rp.permission_id = p.id
     INNER JOIN user_roles ur ON ur.role_id = rp.role_id
     WHERE ur.user_id = ?`,
    [userId]
  );
  return new Set(rows.map((r) => r.code));
}

function hasAnyPermission(permissionSet, codes) {
  if (!permissionSet || !codes.length) return false;
  return codes.some((code) => permissionSet.has(code));
}

function hasAllPermissions(permissionSet, codes) {
  if (!permissionSet || !codes.length) return false;
  return codes.every((code) => permissionSet.has(code));
}

module.exports = {
  loadPermissionCodesForUser,
  hasAnyPermission,
  hasAllPermissions
};
