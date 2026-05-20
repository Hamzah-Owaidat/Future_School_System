const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { sendErrorResponse } = require('../utils/helpers');
const { loadPermissionCodesForUser, hasAnyPermission } = require('../lib/rbac');

const JWT_SECRET = process.env.JWT_SECRET || 'coming-soon-change-on-production';

/**
 * Verify JWT and attach req.auth, req.user, req.permissions.
 * Supports employee and student accounts.
 */
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendErrorResponse(res, 401, 'Not authorized to access this route');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    let userId = decoded.userId ?? decoded.user_id;
    let accountType = decoded.type ?? decoded.account_type;
    let profileId = decoded.profileId ?? decoded.id;

    // Legacy staff tokens: { id: employeeId } only
    if (!userId && profileId && !accountType) {
      const legacy = await query(
        'SELECT e.id, e.user_id FROM employees e WHERE e.id = ? AND e.deleted_at IS NULL',
        [profileId]
      );
      if (legacy.length > 0) {
        userId = legacy[0].user_id;
        accountType = 'employee';
        profileId = legacy[0].id;
      }
    }

    if (!userId || !accountType || !profileId) {
      return sendErrorResponse(res, 401, 'Invalid token payload');
    }

    const users = await query(
      'SELECT id, email, user_type, is_active FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0 || !users[0].is_active) {
      return sendErrorResponse(res, 401, 'Account not found or inactive');
    }

    const userRow = users[0];

    if (userRow.user_type !== accountType) {
      return sendErrorResponse(res, 401, 'Invalid token for this account type');
    }

    req.user = {
      id: userRow.id,
      email: userRow.email,
      type: userRow.user_type
    };

    req.auth = {
      userId: userRow.id,
      type: accountType,
      profileId
    };

    if (accountType === 'employee') {
      const employees = await query(
        `SELECT e.*, r.slug AS role_slug, r.name AS role_name, r.description AS role_description
         FROM employees e
         INNER JOIN users u ON e.user_id = u.id
         INNER JOIN roles r ON e.role_id = r.id
         WHERE e.id = ?
           AND e.user_id = ?
           AND e.deleted_at IS NULL
           AND r.deleted_at IS NULL
           AND e.is_active = TRUE
           AND u.is_active = TRUE`,
        [profileId, userId]
      );

      if (employees.length === 0) {
        return sendErrorResponse(res, 401, 'Employee not found or inactive');
      }

      req.employee = employees[0];
      req.student = null;
      req.permissions = await loadPermissionCodesForUser(userId);
    } else if (accountType === 'student') {
      const students = await query(
        `SELECT s.*,
                c.class_name,
                c.class_code,
                c.grade_level,
                c.academic_year AS class_academic_year
         FROM students s
         INNER JOIN users u ON s.user_id = u.id
         LEFT JOIN classes c ON s.class_id = c.id
         WHERE s.id = ?
           AND s.user_id = ?
           AND s.deleted_at IS NULL
           AND s.is_active = TRUE
           AND u.is_active = TRUE`,
        [profileId, userId]
      );

      if (students.length === 0) {
        return sendErrorResponse(res, 401, 'Student not found or inactive');
      }

      req.student = students[0];
      req.employee = null;
      req.permissions = new Set();
    } else {
      return sendErrorResponse(res, 401, 'Unsupported account type');
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendErrorResponse(res, 401, 'Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      return sendErrorResponse(res, 401, 'Token expired');
    }
    return sendErrorResponse(res, 500, 'Server error');
  }
};

/** Staff-only routes (employees). */
exports.protectEmployee = async (req, res, next) => {
  await exports.protect(req, res, () => {
    if (!req.employee) {
      return sendErrorResponse(res, 403, 'This route is for staff accounts only');
    }
    next();
  });
};

/**
 * Require at least one permission code (from role_permissions).
 * Students never pass unless you add student-specific routes without this middleware.
 */
exports.requirePermission = (...codes) => {
  return (req, res, next) => {
    if (!req.employee) {
      return sendErrorResponse(res, 403, 'Staff access required');
    }

    if (!hasAnyPermission(req.permissions, codes)) {
      return sendErrorResponse(
        res,
        403,
        `Missing required permission: ${codes.join(' or ')}`
      );
    }

    next();
  };
};

/**
 * Legacy role-name guard (prefer requirePermission for new routes).
 */
exports.authorize = (...roleNames) => {
  return (req, res, next) => {
    if (!req.employee) {
      return sendErrorResponse(res, 401, 'Not authorized to access this route');
    }

    const slug = req.employee.role_slug || req.employee.role_name;
    const allowed = roleNames.some(
      (r) => r === slug || r === req.employee.role_name
    );

    if (!allowed) {
      return sendErrorResponse(
        res,
        403,
        `Role '${slug}' is not authorized to access this route`
      );
    }

    next();
  };
};

exports.signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
