const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { sendErrorResponse } = require('../utils/helpers');

/**
 * Protect routes - Verify JWT token
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendErrorResponse(res, 401, 'Not authorized to access this route');
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'coming-soon-change-on-production'
    );

    // Get employee from token
    const employees = await query(
      `SELECT e.*, r.name as role_name 
       FROM employees e 
       INNER JOIN roles r ON e.role_id = r.id 
       WHERE e.id = ? AND e.is_active = TRUE`,
      [decoded.id]
    );

    if (employees.length === 0) {
      return sendErrorResponse(res, 401, 'Employee not found or inactive');
    }

    // Attach employee to request object
    req.employee = employees[0];
    delete req.employee.password;

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

/**
 * Authorize - Check if employee has required role(s)
 * @param {...String} roles - Roles allowed to access the route
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.employee) {
      return sendErrorResponse(res, 401, 'Not authorized to access this route');
    }

    if (!roles.includes(req.employee.role_name)) {
      return sendErrorResponse(
        res,
        403,
        `User role '${req.employee.role_name}' is not authorized to access this route`
      );
    }

    next();
  };
};

