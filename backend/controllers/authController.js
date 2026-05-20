const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../utils/helpers');

/**
 * @desc    Login employee
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return sendErrorResponse(res, 400, 'Please provide email and password');
  }

  // Find employee by email
  const employees = await query(
    `SELECT e.*, r.name as role_name, r.description as role_description 
     FROM employees e 
     INNER JOIN roles r ON e.role_id = r.id 
     WHERE e.email = ? AND e.is_active = TRUE`,
    [email]
  );

  if (employees.length === 0) {
    return sendErrorResponse(res, 401, 'Invalid email or password');
  }

  const employee = employees[0];

  // Check if employee has a password set
  if (!employee.password) {
    return sendErrorResponse(res, 401, 'Account not properly configured. Please contact administrator.');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, employee.password);

  if (!isPasswordValid) {
    return sendErrorResponse(res, 401, 'Invalid email or password');
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      id: employee.id,
      email: employee.email,
      role_id: employee.role_id,
      role_name: employee.role_name
    },
    process.env.JWT_SECRET || 'coming-soon-change-on-production',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );

  // Remove password from response
  delete employee.password;

  // Send response with token
  sendSuccessResponse(res, 200, {
    employee: {
      id: employee.id,
      employee_code: employee.employee_code,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      role_id: employee.role_id,
      role_name: employee.role_name,
      role_description: employee.role_description
    },
    token
  }, 'Login successful');
});

/**
 * @desc    Get current logged in employee
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const employeeId = req.employee.id;

  const employees = await query(
    `SELECT e.*, r.name as role_name, r.description as role_description 
     FROM employees e 
     INNER JOIN roles r ON e.role_id = r.id 
     WHERE e.id = ? AND e.is_active = TRUE`,
    [employeeId]
  );

  if (employees.length === 0) {
    return sendErrorResponse(res, 404, 'Employee not found');
  }

  const employee = employees[0];
  delete employee.password;

  sendSuccessResponse(res, 200, { employee }, 'Employee retrieved successfully');
});

/**
 * @desc    Logout employee (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
  // Since we're using JWT, logout is handled client-side by removing the token
  // But we can log the logout action if needed
  sendSuccessResponse(res, 200, null, 'Logout successful');
});

