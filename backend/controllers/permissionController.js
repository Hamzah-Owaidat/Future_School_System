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
  const { code: codeRaw, name, resource, action, description } = req.body;

  if (!name || !resource || !action) {
    return sendErrorResponse(res, 400, 'Please provide name, resource, and action');
  }

  const code =
    typeof codeRaw === 'string' && codeRaw.trim()
      ? codeRaw.trim()
      : `${String(resource).trim()}.${String(action).trim()}`;

  const existingCode = await query('SELECT id FROM permissions WHERE code = ?', [code]);
  if (existingCode.length > 0) {
    return sendErrorResponse(res, 400, 'Permission code already exists');
  }

  const existingPair = await query(
    'SELECT id FROM permissions WHERE resource = ? AND action = ?',
    [resource, action]
  );
  if (existingPair.length > 0) {
    return sendErrorResponse(res, 400, 'A permission for this resource/action already exists');
  }

  const existingName = await query('SELECT id FROM permissions WHERE name = ?', [name]);
  if (existingName.length > 0) {
    return sendErrorResponse(res, 400, 'Permission name already exists');
  }

  const result = await query(
    `INSERT INTO permissions (code, name, resource, action, description, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      code,
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
  const { code, name, resource, action, description } = req.body;

  const rows = await query('SELECT * FROM permissions WHERE id = ?', [id]);
  if (rows.length === 0) {
    return sendErrorResponse(res, 404, 'Permission not found');
  }

  const cur = rows[0];

  const nextResource = resource !== undefined ? resource : cur.resource;
  const nextAction = action !== undefined ? action : cur.action;
  const nextName = name !== undefined ? name : cur.name;
  const nextDescription = description !== undefined ? description : cur.description;

  if (nextName !== cur.name && nextName) {
    const duplicate = await query('SELECT id FROM permissions WHERE name = ? AND id != ?', [
      nextName,
      id
    ]);
    if (duplicate.length > 0) {
      return sendErrorResponse(res, 400, 'Permission name already exists');
    }
  }

  let nextCode;
  if (code !== undefined && code !== null && String(code).trim()) {
    nextCode = String(code).trim();
  } else if (resource !== undefined || action !== undefined) {
    nextCode = `${String(nextResource).trim()}.${String(nextAction).trim()}`;
  } else {
    nextCode = cur.code;
  }

  const dupCode = await query('SELECT id FROM permissions WHERE code = ? AND id != ?', [nextCode, id]);
  if (dupCode.length > 0) {
    return sendErrorResponse(res, 400, 'Permission code already exists');
  }

  const dupPair = await query(
    'SELECT id FROM permissions WHERE resource = ? AND action = ? AND id != ?',
    [nextResource, nextAction, id]
  );
  if (dupPair.length > 0) {
    return sendErrorResponse(res, 400, 'Another permission already uses this resource/action pair');
  }

  await query(
    `UPDATE permissions SET code = ?, name = ?, resource = ?, action = ?, description = ?, updated_by = ?
     WHERE id = ?`,
    [nextCode, nextName, nextResource, nextAction, nextDescription, req.employee.id, id]
  );

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

