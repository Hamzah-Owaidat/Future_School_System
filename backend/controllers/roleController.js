const { query } = require('../config/database');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../utils/helpers');

/**
 * @desc    Get all roles
 * @route   GET /api/roles
 * @access  Private (Admin)
 */
exports.getAllRoles = asyncHandler(async (req, res, next) => {
  const { active_only = '', show_all = '' } = req.query;

  let sql = `
    SELECT r.*, 
            COUNT(DISTINCT e.id) as employee_count,
            COUNT(DISTINCT rp.permission_id) as permission_count
     FROM roles r
     LEFT JOIN employees e ON r.id = e.role_id AND e.is_active = TRUE AND e.deleted_at IS NULL
     LEFT JOIN role_permissions rp ON r.id = rp.role_id
     WHERE 1=1
  `;

  // Filter by deleted_at: show only non-deleted records by default
  if (show_all !== 'true') {
    sql += ` AND r.deleted_at IS NULL`;
  }

  // Filter by active status if active_only is requested (for dropdowns)
  if (active_only === 'true') {
    sql += ` AND r.is_active = TRUE`;
  }

  sql += ` GROUP BY r.id ORDER BY r.name`;

  const roles = await query(sql);

  sendSuccessResponse(res, 200, { roles }, 'Roles retrieved successfully');
});

/**
 * @desc    Get single role by ID with permissions
 * @route   GET /api/roles/:id
 * @access  Private (Admin)
 */
exports.getRoleById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const roles = await query(
    `SELECT * FROM roles WHERE id = ?`,
    [id]
  );

  if (roles.length === 0) {
    return sendErrorResponse(res, 404, 'Role not found');
  }

  const role = roles[0];

  // Get permissions for this role
  const permissions = await query(
    `SELECT p.* 
     FROM permissions p
     INNER JOIN role_permissions rp ON p.id = rp.permission_id
     WHERE rp.role_id = ?
     ORDER BY p.resource, p.action`,
    [id]
  );

  role.permissions = permissions;

  sendSuccessResponse(res, 200, { role }, 'Role retrieved successfully');
});

/**
 * @desc    Create new role
 * @route   POST /api/roles
 * @access  Private (Admin)
 */
exports.createRole = asyncHandler(async (req, res, next) => {
  const { name, description, is_active, permission_ids } = req.body;

  // Validate required fields
  if (!name) {
    return sendErrorResponse(res, 400, 'Please provide role name');
  }

  // Check if role name already exists
  const existing = await query('SELECT id FROM roles WHERE name = ?', [name]);
  if (existing.length > 0) {
    return sendErrorResponse(res, 400, 'Role name already exists');
  }

  // Insert role
  const result = await query(
    `INSERT INTO roles (name, description, is_active, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?)`,
    [
      name,
      description || null,
      is_active !== undefined ? is_active : true,
      req.employee.id,
      req.employee.id
    ]
  );

  const roleId = result.insertId;

  // Assign permissions if provided
  if (permission_ids && Array.isArray(permission_ids) && permission_ids.length > 0) {
    // Validate all permission IDs exist
    const placeholders = permission_ids.map(() => '?').join(',');
    const existingPermissions = await query(
      `SELECT id FROM permissions WHERE id IN (${placeholders})`,
      permission_ids
    );
    
    if (existingPermissions.length !== permission_ids.length) {
      return sendErrorResponse(res, 400, 'One or more permission IDs are invalid');
    }
    
    // Insert permissions
    for (const permissionId of permission_ids) {
      await query(
        `INSERT INTO role_permissions (role_id, permission_id, created_by, updated_by)
         VALUES (?, ?, ?, ?)`,
        [roleId, permissionId, req.employee.id, req.employee.id]
      );
    }
  }

  // Get created role with permissions
  const roles = await query('SELECT * FROM roles WHERE id = ?', [roleId]);
  const role = roles[0];

  const permissions = await query(
    `SELECT p.* 
     FROM permissions p
     INNER JOIN role_permissions rp ON p.id = rp.permission_id
     WHERE rp.role_id = ?`,
    [roleId]
  );

  role.permissions = permissions;

  sendSuccessResponse(res, 201, { role }, 'Role created successfully');
});

/**
 * @desc    Update role
 * @route   PUT /api/roles/:id
 * @access  Private (Admin)
 */
exports.updateRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, is_active, permission_ids } = req.body;

  // Check if role exists and is not soft deleted
  const existing = await query('SELECT id, deleted_at FROM roles WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Role not found');
  }
  if (existing[0].deleted_at !== null) {
    return sendErrorResponse(res, 403, 'Cannot update a deleted role');
  }

  // Check if role name already exists (excluding current role)
  if (name) {
    const duplicate = await query('SELECT id FROM roles WHERE name = ? AND id != ?', [name, id]);
    if (duplicate.length > 0) {
      return sendErrorResponse(res, 400, 'Role name already exists');
    }
  }

  // Build update query
  const updates = [];
  const params = [];

  if (name) { updates.push('name = ?'); params.push(name); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

  updates.push('updated_by = ?');
  params.push(req.employee.id);
  params.push(id);

  if (updates.length > 1) {
    await query(`UPDATE roles SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  // Update permissions if provided
  if (permission_ids !== undefined && Array.isArray(permission_ids)) {
    // Delete existing permissions
    await query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

    // Add new permissions
    if (permission_ids.length > 0) {
      // Validate all permission IDs exist
      const placeholders = permission_ids.map(() => '?').join(',');
      const existingPermissions = await query(
        `SELECT id FROM permissions WHERE id IN (${placeholders})`,
        permission_ids
      );
      
      if (existingPermissions.length !== permission_ids.length) {
        return sendErrorResponse(res, 400, 'One or more permission IDs are invalid');
      }
      
      // Insert permissions
      for (const permissionId of permission_ids) {
        await query(
          `INSERT INTO role_permissions (role_id, permission_id, created_by, updated_by)
           VALUES (?, ?, ?, ?)`,
          [id, permissionId, req.employee.id, req.employee.id]
        );
      }
    }
  }

  // Get updated role
  const roles = await query('SELECT * FROM roles WHERE id = ?', [id]);
  const role = roles[0];

  const permissions = await query(
    `SELECT p.* 
     FROM permissions p
     INNER JOIN role_permissions rp ON p.id = rp.permission_id
     WHERE rp.role_id = ?`,
    [id]
  );

  role.permissions = permissions;

  sendSuccessResponse(res, 200, { role }, 'Role updated successfully');
});

/**
 * @desc    Delete role
 * @route   DELETE /api/roles/:id
 * @access  Private (Admin)
 */
exports.deleteRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check if role exists
  const existing = await query('SELECT id FROM roles WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Role not found');
  }

  // Check if role is being used by employees
  const employees = await query('SELECT id FROM employees WHERE role_id = ? AND is_active = TRUE', [id]);
  if (employees.length > 0) {
    return sendErrorResponse(res, 400, 'Cannot delete role. It is assigned to active employees.');
  }

  // Delete role permissions first (CASCADE should handle this, but being explicit)
  await query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

  // Soft delete role (set is_active to false and deleted_at timestamp)
  await query(
    'UPDATE roles SET is_active = FALSE, deleted_at = NOW(), updated_by = ? WHERE id = ?',
    [req.employee.id, id]
  );

  sendSuccessResponse(res, 200, null, 'Role deleted successfully');
});

