const { query } = require('../config/database');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../utils/helpers');

/**
 * @desc    Get all permissions
 * @route   GET /api/permissions
 * @access  Private (Admin)
 */
exports.getAllPermissions = asyncHandler(async (req, res, next) => {
  const { resource = '', action = '' } = req.query;

  let sql = `
    SELECT p.*, 
           COUNT(DISTINCT rp.role_id) as role_count
    FROM permissions p
    LEFT JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE 1=1
  `;
  const params = [];

  if (resource) {
    sql += ` AND p.resource = ?`;
    params.push(resource);
  }

  if (action) {
    sql += ` AND p.action = ?`;
    params.push(action);
  }

  sql += ` GROUP BY p.id ORDER BY p.resource, p.action`;

  const permissions = await query(sql, params);

  sendSuccessResponse(res, 200, { permissions }, 'Permissions retrieved successfully');
});

/**
 * @desc    Get permissions grouped by resource
 * @route   GET /api/permissions/grouped
 * @access  Private (Admin)
 */
exports.getGroupedPermissions = asyncHandler(async (req, res, next) => {
  const permissions = await query(
    `SELECT p.*, 
            COUNT(DISTINCT rp.role_id) as role_count
     FROM permissions p
     LEFT JOIN role_permissions rp ON p.id = rp.permission_id
     GROUP BY p.id
     ORDER BY p.resource, p.action`
  );

  // Group by resource
  const grouped = {};
  permissions.forEach(permission => {
    if (!grouped[permission.resource]) {
      grouped[permission.resource] = [];
    }
    grouped[permission.resource].push(permission);
  });

  sendSuccessResponse(res, 200, { permissions: grouped }, 'Permissions retrieved successfully');
});

/**
 * @desc    Get single permission by ID
 * @route   GET /api/permissions/:id
 * @access  Private (Admin)
 */
exports.getPermissionById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const permissions = await query(
    `SELECT p.*, 
            COUNT(DISTINCT rp.role_id) as role_count
     FROM permissions p
     LEFT JOIN role_permissions rp ON p.id = rp.permission_id
     WHERE p.id = ?
     GROUP BY p.id`,
    [id]
  );

  if (permissions.length === 0) {
    return sendErrorResponse(res, 404, 'Permission not found');
  }

  // Get roles that have this permission
  const roles = await query(
    `SELECT r.* 
     FROM roles r
     INNER JOIN role_permissions rp ON r.id = rp.role_id
     WHERE rp.permission_id = ?`,
    [id]
  );

  const permission = permissions[0];
  permission.roles = roles;

  sendSuccessResponse(res, 200, { permission }, 'Permission retrieved successfully');
});

/**
 * @desc    Create new permission
 * @route   POST /api/permissions
 * @access  Private (Admin)
 */
exports.createPermission = asyncHandler(async (req, res, next) => {
  const { name, resource, action, description } = req.body;

  // Validate required fields
  if (!name || !resource || !action) {
    return sendErrorResponse(res, 400, 'Please provide name, resource, and action');
  }

  // Check if permission name already exists
  const existing = await query('SELECT id FROM permissions WHERE name = ?', [name]);
  if (existing.length > 0) {
    return sendErrorResponse(res, 400, 'Permission name already exists');
  }

  // Insert permission
  const result = await query(
    `INSERT INTO permissions (name, resource, action, description, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      name,
      resource,
      action,
      description || null,
      req.employee.id,
      req.employee.id
    ]
  );

  // Get created permission
  const permissions = await query('SELECT * FROM permissions WHERE id = ?', [result.insertId]);

  sendSuccessResponse(res, 201, { permission: permissions[0] }, 'Permission created successfully');
});

/**
 * @desc    Update permission
 * @route   PUT /api/permissions/:id
 * @access  Private (Admin)
 */
exports.updatePermission = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, resource, action, description } = req.body;

  // Check if permission exists
  const existing = await query('SELECT id FROM permissions WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Permission not found');
  }

  // Check if permission name already exists (excluding current permission)
  if (name) {
    const duplicate = await query('SELECT id FROM permissions WHERE name = ? AND id != ?', [name, id]);
    if (duplicate.length > 0) {
      return sendErrorResponse(res, 400, 'Permission name already exists');
    }
  }

  // Build update query
  const updates = [];
  const params = [];

  if (name) { updates.push('name = ?'); params.push(name); }
  if (resource) { updates.push('resource = ?'); params.push(resource); }
  if (action) { updates.push('action = ?'); params.push(action); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }

  updates.push('updated_by = ?');
  params.push(req.employee.id);
  params.push(id);

  await query(`UPDATE permissions SET ${updates.join(', ')} WHERE id = ?`, params);

  // Get updated permission
  const permissions = await query('SELECT * FROM permissions WHERE id = ?', [id]);

  sendSuccessResponse(res, 200, { permission: permissions[0] }, 'Permission updated successfully');
});

/**
 * @desc    Delete permission
 * @route   DELETE /api/permissions/:id
 * @access  Private (Admin)
 */
exports.deletePermission = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check if permission exists
  const existing = await query('SELECT id FROM permissions WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Permission not found');
  }

  // Check if permission is assigned to any roles
  const roles = await query('SELECT role_id FROM role_permissions WHERE permission_id = ?', [id]);
  if (roles.length > 0) {
    return sendErrorResponse(res, 400, 'Cannot delete permission. It is assigned to roles.');
  }

  // Delete permission (CASCADE should handle role_permissions automatically)
  await query('DELETE FROM permissions WHERE id = ?', [id]);

  sendSuccessResponse(res, 200, null, 'Permission deleted successfully');
});

