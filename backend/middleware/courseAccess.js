const { query } = require('../config/database');
const { sendErrorResponse } = require('../utils/helpers');

/**
 * Ensure the current employee (teacher) is allowed to manage notes
 * for the given class, course, and academic year.
 *
 * Admins and principals are always allowed.
 */
exports.canManageCourseNotes = async (req, res, next) => {
  const employee = req.employee;

  if (!employee) {
    return sendErrorResponse(res, 401, 'Not authorized to access this route');
  }

  // Admins and principals can always manage
  if (employee.role_name === 'admin' || employee.role_name === 'principal') {
    return next();
  }

  // Teachers can only manage notes for their assigned class/course
  if (employee.role_name !== 'teacher') {
    return sendErrorResponse(res, 403, 'Only teachers and admins can manage course notes');
  }

  const { class_id, course_id, academic_year } = req.body.student_id
    ? req.body
    : req.query;

  if (!class_id || !course_id || !academic_year) {
    return sendErrorResponse(
      res,
      400,
      'class_id, course_id, and academic_year are required for this operation'
    );
  }

  const assignments = await query(
    `SELECT id FROM class_courses
     WHERE class_id = ? AND course_id = ? AND academic_year = ? AND teacher_id = ? AND is_active = TRUE`,
    [parseInt(class_id), parseInt(course_id), academic_year, employee.id]
  );

  if (assignments.length === 0) {
    return sendErrorResponse(
      res,
      403,
      'You are not assigned as the teacher for this class and course in the given academic year'
    );
  }

  next();
};


