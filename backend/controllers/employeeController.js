const { query } = require('../config/database');
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
    INNER JOIN roles r ON e.role_id = r.id
    WHERE 1=1
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
    sql += ` AND e.role_id = ?`;
    params.push(parseInt(role_id));
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
    WHERE 1=1
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
    countSql += ` AND e.role_id = ?`;
    countParams.push(parseInt(role_id));
  }

  if (is_active !== '') {
    countSql += ` AND e.is_active = ?`;
    countParams.push(is_active === 'true' || is_active === true);
  }

  const countResult = await query(countSql, countParams);
  const total = countResult[0].total;

  // Remove passwords from response
  employees.forEach(emp => delete emp.password);

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
     INNER JOIN roles r ON e.role_id = r.id
     WHERE e.id = ?`,
    [id]
  );

  if (employees.length === 0) {
    return sendErrorResponse(res, 404, 'Employee not found');
  }

  const employee = employees[0];
  delete employee.password;

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

  // Validate required fields (employee_code is now optional)
  if (!first_name || !last_name || !email || !hire_date || !role_id) {
    return sendErrorResponse(res, 400, 'Please provide all required fields');
  }

  // Generate employee code if not provided
  let finalEmployeeCode = employee_code;
  if (!finalEmployeeCode) {
    finalEmployeeCode = await generateEmployeeCode();
  }

  // Check if employee_code or email already exists
  const existing = await query(
    'SELECT id FROM employees WHERE employee_code = ? OR email = ?',
    [finalEmployeeCode, email]
  );

  if (existing.length > 0) {
    return sendErrorResponse(res, 400, 'Employee code or email already exists');
  }

  // Hash password if provided
  let hashedPassword = null;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  // Insert employee
  const result = await query(
    `INSERT INTO employees 
     (employee_code, first_name, last_name, email, password, phone, date_of_birth, 
      gender, address, hire_date, salary, role_id, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      finalEmployeeCode,
      first_name,
      last_name,
      email,
      hashedPassword,
      phone || null,
      date_of_birth || null,
      gender || 'other',
      address || null,
      hire_date,
      salary || null,
      role_id,
      req.employee.id,
      req.employee.id
    ]
  );

  // Get created employee
  const employees = await query(
    `SELECT e.*, r.name as role_name, r.description as role_description
     FROM employees e
     INNER JOIN roles r ON e.role_id = r.id
     WHERE e.id = ?`,
    [result.insertId]
  );

  const employee = employees[0];
  delete employee.password;

  sendSuccessResponse(res, 201, { employee }, 'Employee created successfully');
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

  // Check if employee exists and is not soft deleted
  const existing = await query('SELECT id, deleted_at FROM employees WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Employee not found');
  }
  if (existing[0].deleted_at !== null) {
    return sendErrorResponse(res, 403, 'Cannot update a deleted employee');
  }

  // Check if employee_code or email already exists (excluding current employee)
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

  // Build update query dynamically
  const updates = [];
  const params = [];

  if (employee_code) { updates.push('employee_code = ?'); params.push(employee_code); }
  if (first_name) { updates.push('first_name = ?'); params.push(first_name); }
  if (last_name) { updates.push('last_name = ?'); params.push(last_name); }
  if (email) { updates.push('email = ?'); params.push(email); }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
  if (date_of_birth) { updates.push('date_of_birth = ?'); params.push(date_of_birth); }
  if (gender) { updates.push('gender = ?'); params.push(gender); }
  if (address !== undefined) { updates.push('address = ?'); params.push(address); }
  if (hire_date) { updates.push('hire_date = ?'); params.push(hire_date); }
  if (salary !== undefined) { updates.push('salary = ?'); params.push(salary); }
  if (role_id) { updates.push('role_id = ?'); params.push(role_id); }
  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

  // Handle password update
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updates.push('password = ?');
    params.push(hashedPassword);
  }

  updates.push('updated_by = ?');
  params.push(req.employee.id);
  params.push(id);

  // Check if there are any updates (besides updated_by)
  if (updates.length <= 1) {
    return sendErrorResponse(res, 400, 'No fields to update');
  }

  await query(
    `UPDATE employees SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  // Get updated employee
  const employees = await query(
    `SELECT e.*, r.name as role_name, r.description as role_description
     FROM employees e
     INNER JOIN roles r ON e.role_id = r.id
     WHERE e.id = ?`,
    [id]
  );

  const employee = employees[0];
  delete employee.password;

  sendSuccessResponse(res, 200, { employee }, 'Employee updated successfully');
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

  sendSuccessResponse(res, 200, null, 'Employee deleted successfully');
});

