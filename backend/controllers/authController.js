const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../utils/helpers');
const { signToken } = require('../middleware/auth');
const { loadPermissionCodesForUser } = require('../lib/rbac');

/**
 * @desc    Login (staff or student portal)
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendErrorResponse(res, 400, 'Please provide email and password');
  }

  const users = await query(
    `SELECT id, email, password_hash, user_type, is_active
     FROM users WHERE email = ?`,
    [email]
  );

  if (users.length === 0) {
    return sendErrorResponse(res, 401, 'Invalid email or password');
  }

  const user = users[0];

  if (!user.is_active) {
    return sendErrorResponse(res, 401, 'Account is inactive');
  }

  if (!user.password_hash) {
    return sendErrorResponse(res, 401, 'Account not properly configured. Please contact administrator.');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return sendErrorResponse(res, 401, 'Invalid email or password');
  }

  if (user.user_type === 'employee') {
    const employees = await query(
      `SELECT e.*, r.slug AS role_slug, r.name AS role_name, r.description AS role_description
       FROM employees e
       INNER JOIN roles r ON e.role_id = r.id
       WHERE e.user_id = ?
         AND e.deleted_at IS NULL
         AND r.deleted_at IS NULL
         AND e.is_active = TRUE`,
      [user.id]
    );

    if (employees.length === 0) {
      return sendErrorResponse(res, 401, 'Employee profile not found or inactive');
    }

    const employee = employees[0];
    const permissions = await loadPermissionCodesForUser(user.id);

    const token = signToken({
      userId: user.id,
      type: 'employee',
      profileId: employee.id,
      roleSlug: employee.role_slug
    });

    return sendSuccessResponse(
      res,
      200,
      {
        account_type: 'employee',
        employee: {
          id: employee.id,
          employee_code: employee.employee_code,
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          role_id: employee.role_id,
          role_slug: employee.role_slug,
          role_name: employee.role_name,
          role_description: employee.role_description
        },
        permissions: [...permissions],
        token
      },
      'Login successful'
    );
  }

  if (user.user_type === 'student') {
    const students = await query(
      `SELECT s.*, c.class_name, c.class_code, c.grade_level
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.user_id = ?
         AND s.deleted_at IS NULL
         AND s.is_active = TRUE`,
      [user.id]
    );

    if (students.length === 0) {
      return sendErrorResponse(res, 401, 'Student profile not found or inactive');
    }

    const student = students[0];

    const token = signToken({
      userId: user.id,
      type: 'student',
      profileId: student.id
    });

    return sendSuccessResponse(
      res,
      200,
      {
        account_type: 'student',
        student: {
          id: student.id,
          student_code: student.student_code,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          class_id: student.class_id,
          class_name: student.class_name,
          class_code: student.class_code,
          grade_level: student.grade_level
        },
        token
      },
      'Login successful'
    );
  }

  return sendErrorResponse(res, 401, 'Unsupported account type');
});

/**
 * @desc    Current account (employee or student)
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  if (req.employee) {
    return sendSuccessResponse(
      res,
      200,
      {
        account_type: 'employee',
        employee: req.employee,
        permissions: [...(req.permissions || [])]
      },
      'Profile retrieved successfully'
    );
  }

  if (req.student) {
    return sendSuccessResponse(
      res,
      200,
      {
        account_type: 'student',
        student: req.student
      },
      'Profile retrieved successfully'
    );
  }

  return sendErrorResponse(res, 401, 'Not authenticated');
});

exports.logout = asyncHandler(async (req, res, next) => {
  sendSuccessResponse(res, 200, null, 'Logout successful');
});
