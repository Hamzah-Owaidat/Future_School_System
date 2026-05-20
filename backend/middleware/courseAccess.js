const { query } = require('../config/database');
const { sendErrorResponse } = require('../utils/helpers');
const { hasAnyPermission } = require('../lib/rbac');

/**
 * Teachers may write notes only for their class_courses assignments.
 * Staff with course_note.manage may write any note.
 */
exports.canManageCourseNotes = async (req, res, next) => {
  if (!req.employee) {
    return sendErrorResponse(res, 403, 'Only staff can create or update course notes');
  }

  if (hasAnyPermission(req.permissions, ['course_note.manage'])) {
    return next();
  }

  if (!hasAnyPermission(req.permissions, ['course_note.write'])) {
    return sendErrorResponse(res, 403, 'You do not have permission to edit course notes');
  }

  const body = req.body || {};
  const { class_id, course_id, academic_year } = body;

  let classId = class_id;
  let courseId = course_id;
  let year = academic_year;

  if ((!classId || !courseId || !year) && req.params.id) {
    const rows = await query(
      'SELECT class_id, course_id, academic_year FROM course_notes WHERE id = ?',
      [req.params.id]
    );
    if (rows.length) {
      classId = classId ?? rows[0].class_id;
      courseId = courseId ?? rows[0].course_id;
      year = year ?? rows[0].academic_year;
    }
  }

  if (!classId || !courseId || !year) {
    return sendErrorResponse(
      res,
      400,
      'class_id, course_id, and academic_year are required for this operation'
    );
  }

  const assignments = await query(
    `SELECT id FROM class_courses
     WHERE class_id = ? AND course_id = ? AND academic_year = ?
       AND teacher_id = ? AND is_active = TRUE AND deleted_at IS NULL`,
    [parseInt(classId, 10), parseInt(courseId, 10), year, req.employee.id]
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
