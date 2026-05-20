const { query, pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../utils/helpers');

/**
 * @desc    Get all employees
 * @route   GET /api/employees
 * @access  Private (Admin, Principal)
 */
exports.getAllEmployees = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, search = '', role_id = '', is_active = '', show_all = '' } = req.query;
  
  // Ensure proper integer conversion
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const offset = (pageNum - 1) * limitNum;

  let sql = `
    SELECT e.*, r.name as role_name, r.description as role_description
    FROM employees e
    INNER JOIN users u ON e.user_id = u.id
    INNER JOIN roles r ON e.role_id = r.id
    WHERE 1=1 AND r.deleted_at IS NULL
  `;
  const params = [];

  // Filter by deleted_at: show only non-deleted records by default
  // If show_all=true, include deleted records too
  if (show_all !== 'true') {
    sql += ` AND e.deleted_at IS NULL`;
  }

  if (search) {
    sql += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.employee_code LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (role_id) {
    sql += ` AND (e.role_id = ? OR EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.user_id = e.user_id AND ur.role_id = ?
    ))`;
    const rid = parseInt(role_id, 10);
    params.push(rid, rid);
  }

  if (is_active !== '') {
    sql += ` AND e.is_active = ?`;
    params.push(is_active === 'true' || is_active === true);
  }

  // Use template literal for LIMIT/OFFSET to avoid parameter issues
  sql += ` ORDER BY e.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

  const employees = await query(sql, params);

  // Get total count
  let countSql = `
    SELECT COUNT(*) as total
    FROM employees e
    INNER JOIN roles r ON e.role_id = r.id
    WHERE 1=1 AND r.deleted_at IS NULL
  `;
  const countParams = [];

  // Apply same deleted_at filter to count query
  if (show_all !== 'true') {
    countSql += ` AND e.deleted_at IS NULL`;
  }

  if (search) {
    countSql += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.employee_code LIKE ?)`;
    const searchTerm = `%${search}%`;
    countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (role_id) {
    countSql += ` AND (e.role_id = ? OR EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.user_id = e.user_id AND ur.role_id = ?
    ))`;
    const rid = parseInt(role_id, 10);
    countParams.push(rid, rid);
  }

  if (is_active !== '') {
    countSql += ` AND e.is_active = ?`;
    countParams.push(is_active === 'true' || is_active === true);
  }

  const countResult = await query(countSql, countParams);
  const total = countResult[0].total;

  sendSuccessResponse(res, 200, {
    employees,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  }, 'Employees retrieved successfully');
});

/**
 * @desc    Get single employee by ID
 * @route   GET /api/employees/:id
 * @access  Private
 */
exports.getEmployeeById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const employees = await query(
    `SELECT e.*, r.name as role_name, r.description as role_description
     FROM employees e
     INNER JOIN users u ON e.user_id = u.id
     INNER JOIN roles r ON e.role_id = r.id
     WHERE e.id = ? AND e.deleted_at IS NULL AND r.deleted_at IS NULL`,
    [id]
  );

  if (employees.length === 0) {
    return sendErrorResponse(res, 404, 'Employee not found');
  }

  const employee = employees[0];

  sendSuccessResponse(res, 200, { employee }, 'Employee retrieved successfully');
});

/**
 * @desc    Generate unique employee code
 * @returns {Promise<string>} Generated employee code
 */
const generateEmployeeCode = async () => {
  // Find the highest existing employee code number
  const result = await query(
    `SELECT employee_code 
     FROM employees 
     WHERE employee_code LIKE 'EMP%' 
     ORDER BY CAST(SUBSTRING(employee_code, 4) AS UNSIGNED) DESC 
     LIMIT 1`
  );

  let nextNumber = 1;

  if (result.length > 0) {
    const lastCode = result[0].employee_code;
    // Extract number from code (e.g., "EMP001" -> 1)
    const lastNumber = parseInt(lastCode.substring(3)) || 0;
    nextNumber = lastNumber + 1;
  }

  // Format as EMP001, EMP002, etc. (3 digits minimum)
  const employeeCode = `EMP${String(nextNumber).padStart(3, '0')}`;

  // Double-check uniqueness (handle edge cases)
  const exists = await query(
    'SELECT id FROM employees WHERE employee_code = ?',
    [employeeCode]
  );

  if (exists.length > 0) {
    // If somehow it exists, try next number (with max retry to prevent infinite loop)
    const maxRetries = 100;
    let retries = 0;
    let newCode = employeeCode;
    
    while (retries < maxRetries) {
      const nextNumber = parseInt(newCode.substring(3)) + 1;
      newCode = `EMP${String(nextNumber).padStart(3, '0')}`;
      
      const checkExists = await query(
        'SELECT id FROM employees WHERE employee_code = ?',
        [newCode]
      );
      
      if (checkExists.length === 0) {
        return newCode;
      }
      
      retries++;
    }
    
    // If we've exhausted retries, throw error
    throw new Error('Unable to generate unique employee code after maximum retries');
  }

  return employeeCode;
};

/**
 * @desc    Create new employee
 * @route   POST /api/employees
 * @access  Private (Admin)
 */
exports.createEmployee = asyncHandler(async (req, res, next) => {
  const {
    employee_code,
    first_name,
    last_name,
    email,
    password,
    phone,
    date_of_birth,
    gender,
    address,
    hire_date,
    salary,
    role_id
  } = req.body;

  if (!first_name || !last_name || !email || !hire_date || !role_id) {
    return sendErrorResponse(res, 400, 'Please provide all required fields');
  }

  let finalEmployeeCode = employee_code;
  if (!finalEmployeeCode) {
    finalEmployeeCode = await generateEmployeeCode();
  }

  const dupUser = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (dupUser.length > 0) {
    return sendErrorResponse(res, 400, 'That email already has a login account');
  }

  const existingEmp = await query(
    'SELECT id FROM employees WHERE employee_code = ? OR email = ? LIMIT 1',
    [finalEmployeeCode, email]
  );
  if (existingEmp.length > 0) {
    return sendErrorResponse(res, 400, 'Employee code or email already exists');
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

  const actorId = req.employee?.id ?? null;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [uRes] = await conn.execute(
      `INSERT INTO users (email, password_hash, user_type, is_active)
       VALUES (?, ?, 'employee', TRUE)`,
      [email, hashedPassword]
    );
    const userId = uRes.insertId;

    const [eRes] = await conn.execute(
      `INSERT INTO employees
       (user_id, employee_code, first_name, last_name, email, phone, date_of_birth,
        gender, address, hire_date, salary, role_id,
        created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        finalEmployeeCode,
        first_name,
        last_name,
        email,
        phone || null,
        date_of_birth || null,
        gender || 'other',
        address || null,
        hire_date,
        salary || null,
        role_id,
        actorId,
        actorId
      ]
    );
    const employeeId = eRes.insertId;

    await conn.execute(
      `INSERT INTO user_roles (user_id, role_id, created_by, updated_by)
       VALUES (?, ?, ?, ?)`,
      [userId, role_id, actorId, actorId]
    );

    await conn.commit();

    const employees = await query(
      `SELECT e.*, r.name as role_name, r.description as role_description
       FROM employees e
       INNER JOIN roles r ON e.role_id = r.id
       WHERE e.id = ?`,
      [employeeId]
    );

    sendSuccessResponse(res, 201, { employee: employees[0] }, 'Employee created successfully');
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) conn.release();
  }
});

/**
 * @desc    Update employee
 * @route   PUT /api/employees/:id
 * @access  Private (Admin)
 */
exports.updateEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    employee_code,
    first_name,
    last_name,
    email,
    password,
    phone,
    date_of_birth,
    gender,
    address,
    hire_date,
    salary,
    role_id,
    is_active
  } = req.body;

  const existingRow = await query(
    'SELECT id, user_id, deleted_at FROM employees WHERE id = ?',
    [id]
  );
  if (existingRow.length === 0) {
    return sendErrorResponse(res, 404, 'Employee not found');
  }
  if (existingRow[0].deleted_at !== null) {
    return sendErrorResponse(res, 403, 'Cannot update a deleted employee');
  }

  const userId = existingRow[0].user_id;

  if (employee_code || email) {
    const conditions = [];
    const checkParams = [];

    if (employee_code) {
      conditions.push('employee_code = ?');
      checkParams.push(employee_code);
    }

    if (email) {
      conditions.push('email = ?');
      checkParams.push(email);
    }

    if (conditions.length > 0) {
      checkParams.push(id);
      const duplicate = await query(
        `SELECT id FROM employees WHERE (${conditions.join(' OR ')}) AND id != ?`,
        checkParams
      );
      if (duplicate.length > 0) {
        return sendErrorResponse(res, 400, 'Employee code or email already exists');
      }
    }
  }

  if (email) {
    const dupUser = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
    if (dupUser.length > 0) {
      return sendErrorResponse(res, 400, 'That email is already used by another account');
    }
  }

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);
  }

  if (email) {
    await query('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
  }

  const updates = [];
  const params = [];

  if (employee_code) {
    updates.push('employee_code = ?');
    params.push(employee_code);
  }
  if (first_name) {
    updates.push('first_name = ?');
    params.push(first_name);
  }
  if (last_name) {
    updates.push('last_name = ?');
    params.push(last_name);
  }
  if (email) {
    updates.push('email = ?');
    params.push(email);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    params.push(phone);
  }
  if (date_of_birth) {
    updates.push('date_of_birth = ?');
    params.push(date_of_birth);
  }
  if (gender) {
    updates.push('gender = ?');
    params.push(gender);
  }
  if (address !== undefined) {
    updates.push('address = ?');
    params.push(address);
  }
  if (hire_date) {
    updates.push('hire_date = ?');
    params.push(hire_date);
  }
  if (salary !== undefined) {
    updates.push('salary = ?');
    params.push(salary);
  }
  if (role_id) {
    updates.push('role_id = ?');
    params.push(role_id);
  }
  if (is_active !== undefined) {
    updates.push('is_active = ?');
    params.push(is_active);
  }

  updates.push('updated_by = ?');
  params.push(req.employee.id);
  params.push(id);

  if (updates.length <= 1 && !password && !email) {
    return sendErrorResponse(res, 400, 'No fields to update');
  }

  if (updates.length > 1) {
    await query(`UPDATE employees SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  if (role_id !== undefined && role_id !== null) {
    await query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
    await query(
      `INSERT INTO user_roles (user_id, role_id, created_by, updated_by) VALUES (?, ?, ?, ?)`,
      [userId, role_id, req.employee.id, req.employee.id]
    );
  }

  if (is_active !== undefined) {
    await query('UPDATE users SET is_active = ? WHERE id = ?', [is_active, userId]);
  }

  const employees = await query(
    `SELECT e.*, r.name as role_name, r.description as role_description
     FROM employees e
     INNER JOIN roles r ON e.role_id = r.id
     WHERE e.id = ?`,
    [id]
  );

  sendSuccessResponse(res, 200, { employee: employees[0] }, 'Employee updated successfully');
});

/**
 * @desc    Delete employee
 * @route   DELETE /api/employees/:id
 * @access  Private (Admin)
 */
exports.deleteEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check if employee exists
  const existing = await query('SELECT id FROM employees WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Employee not found');
  }

  // Soft delete (set is_active to false and deleted_at timestamp)
  await query(
    'UPDATE employees SET is_active = FALSE, deleted_at = NOW(), updated_by = ? WHERE id = ?',
    [req.employee.id, id]
  );

  await query(
    `UPDATE users u
     INNER JOIN employees e ON e.user_id = u.id
     SET u.is_active = FALSE
     WHERE e.id = ?`,
    [id]
  );

  sendSuccessResponse(res, 200, null, 'Employee deleted successfully');
});

