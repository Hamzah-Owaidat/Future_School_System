const { query } = require('../config/database');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../utils/helpers');
const { hasAnyPermission } = require('../lib/rbac');
const { getActorEmployeeId } = require('../utils/actor');

function canViewAllNotes(req) {
  return (
    req.employee &&
    hasAnyPermission(req.permissions, ['course_note.manage', 'course_note.read'])
  );
}

/**
 * @desc    Get course notes (grades) with filters
 * @route   GET /api/course-notes
 */
exports.getCourseNotes = asyncHandler(async (req, res, next) => {
  const {
    student_id = '',
    class_id = '',
    course_id = '',
    teacher_id = '',
    academic_year = '',
    semester = ''
  } = req.query;

  let sql = `
    SELECT cn.*,
           s.first_name AS student_first_name,
           s.last_name AS student_last_name,
           s.student_code,
           c.name AS course_name,
           c.code AS course_code,
           cl.class_name,
           cl.class_code,
           e.first_name AS teacher_first_name,
           e.last_name AS teacher_last_name,
           e.employee_code AS teacher_code
    FROM course_notes cn
    INNER JOIN students s ON cn.student_id = s.id AND s.deleted_at IS NULL
    INNER JOIN classes cl ON cn.class_id = cl.id
    INNER JOIN courses c ON cn.course_id = c.id
    INNER JOIN employees e ON cn.teacher_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (req.student) {
    sql += ` AND cn.student_id = ?`;
    params.push(req.student.id);
  } else if (req.employee) {
    if (hasAnyPermission(req.permissions, ['course_note.manage'])) {
      // no extra filter
    } else if (hasAnyPermission(req.permissions, ['course_note.read', 'course_note.write'])) {
      sql += ` AND cn.teacher_id = ?`;
      params.push(req.employee.id);
    } else {
      return sendErrorResponse(res, 403, 'You do not have permission to view course notes');
    }
  }

  if (student_id && canViewAllNotes(req)) {
    sql += ` AND cn.student_id = ?`;
    params.push(parseInt(student_id, 10));
  }
  if (class_id) {
    sql += ` AND cn.class_id = ?`;
    params.push(parseInt(class_id, 10));
  }
  if (course_id) {
    sql += ` AND cn.course_id = ?`;
    params.push(parseInt(course_id, 10));
  }
  if (teacher_id && canViewAllNotes(req)) {
    sql += ` AND cn.teacher_id = ?`;
    params.push(parseInt(teacher_id, 10));
  }
  if (academic_year) {
    sql += ` AND cn.academic_year = ?`;
    params.push(academic_year);
  }
  if (semester) {
    sql += ` AND cn.semester = ?`;
    params.push(parseInt(semester, 10));
  }

  sql += ` ORDER BY cn.academic_year, cn.semester, s.last_name, s.first_name, c.name`;

  const notes = await query(sql, params);

  sendSuccessResponse(res, 200, { notes }, 'Course notes retrieved successfully');
});

/**
 * @desc    Get course notes for one student
 * @route   GET /api/course-notes/student/:studentId
 */
exports.getStudentCourseNotes = asyncHandler(async (req, res, next) => {
  const studentId = parseInt(req.params.studentId, 10);
  const { academic_year = '' } = req.query;

  if (req.student && req.student.id !== studentId) {
    return sendErrorResponse(res, 403, 'You can only view your own course notes');
  }

  if (req.employee && !canViewAllNotes(req)) {
    if (hasAnyPermission(req.permissions, ['course_note.read', 'course_note.write'])) {
      // allowed — may filter by teacher in query below if needed
    } else {
      return sendErrorResponse(res, 403, 'You do not have permission to view course notes');
    }
  }

  let sql = `
    SELECT cn.*,
           c.name AS course_name,
           c.code AS course_code,
           cl.class_name,
           cl.class_code
    FROM course_notes cn
    INNER JOIN courses c ON cn.course_id = c.id
    INNER JOIN classes cl ON cn.class_id = cl.id
    WHERE cn.student_id = ?
  `;
  const params = [studentId];

  if (req.employee && !hasAnyPermission(req.permissions, ['course_note.manage'])) {
    sql += ` AND cn.teacher_id = ?`;
    params.push(req.employee.id);
  }

  if (academic_year) {
    sql += ` AND cn.academic_year = ?`;
    params.push(academic_year);
  }

  sql += ` ORDER BY cn.academic_year, cn.semester, c.name`;

  const notes = await query(sql, params);

  sendSuccessResponse(res, 200, { notes }, 'Student course notes retrieved successfully');
});

/**
 * @desc    Get own notes (student portal)
 * @route   GET /api/course-notes/me
 */
exports.getMyCourseNotes = asyncHandler(async (req, res, next) => {
  if (!req.student) {
    return sendErrorResponse(res, 403, 'Only students can use this endpoint');
  }

  req.params.studentId = String(req.student.id);
  return exports.getStudentCourseNotes(req, res, next);
});

exports.upsertCourseNote = asyncHandler(async (req, res, next) => {
  const {
    student_id,
    class_id,
    course_id,
    academic_year,
    semester,
    partial1_score = 0,
    partial2_score = 0,
    final_score = 0,
    partial1_total = 0,
    partial2_total = 0,
    final_total = 0,
    semester_total = 0,
    comment
  } = req.body;

  if (!student_id || !class_id || !course_id || !academic_year || !semester) {
    return sendErrorResponse(
      res,
      400,
      'Please provide student_id, class_id, course_id, academic_year, and semester'
    );
  }

  const sem = parseInt(semester, 10);
  if (![1, 2, 3].includes(sem)) {
    return sendErrorResponse(res, 400, 'Semester must be 1, 2, or 3');
  }

  const students = await query(
    'SELECT id, class_id FROM students WHERE id = ? AND deleted_at IS NULL AND is_active = TRUE',
    [student_id]
  );
  if (students.length === 0) {
    return sendErrorResponse(res, 400, 'Student not found or inactive');
  }

  const existing = await query(
    `SELECT id FROM course_notes
     WHERE student_id = ? AND class_id = ? AND course_id = ? AND academic_year = ? AND semester = ?`,
    [student_id, class_id, course_id, academic_year, sem]
  );

  const teacherId = req.employee.id;
  const actorId = getActorEmployeeId(req);

  if (existing.length === 0) {
    const result = await query(
      `INSERT INTO course_notes
       (student_id, class_id, course_id, teacher_id, academic_year, semester,
        partial1_score, partial2_score, final_score,
        partial1_total, partial2_total, final_total, semester_total,
        comment, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_id,
        class_id,
        course_id,
        teacherId,
        academic_year,
        sem,
        partial1_score,
        partial2_score,
        final_score,
        partial1_total,
        partial2_total,
        final_total,
        semester_total,
        comment || null,
        actorId,
        actorId
      ]
    );

    const notes = await query(`SELECT * FROM course_notes WHERE id = ?`, [result.insertId]);
    sendSuccessResponse(res, 201, { note: notes[0] }, 'Course note created successfully');
  } else {
    const id = existing[0].id;
    await query(
      `UPDATE course_notes SET
        teacher_id = ?,
        partial1_score = ?,
        partial2_score = ?,
        final_score = ?,
        partial1_total = ?,
        partial2_total = ?,
        final_total = ?,
        semester_total = ?,
        comment = ?,
        updated_by = ?
       WHERE id = ?`,
      [
        teacherId,
        partial1_score,
        partial2_score,
        final_score,
        partial1_total,
        partial2_total,
        final_total,
        semester_total,
        comment || null,
        actorId,
        id
      ]
    );

    const notes = await query(`SELECT * FROM course_notes WHERE id = ?`, [id]);
    sendSuccessResponse(res, 200, { note: notes[0] }, 'Course note updated successfully');
  }
});

exports.updateCourseNoteById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const existing = await query('SELECT * FROM course_notes WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Course note not found');
  }

  const note = existing[0];

  if (
    req.employee &&
    !hasAnyPermission(req.permissions, ['course_note.manage']) &&
    hasAnyPermission(req.permissions, ['course_note.write']) &&
    note.teacher_id !== req.employee.id
  ) {
    return sendErrorResponse(res, 403, 'You can only update notes you created or are assigned to teach');
  }

  const {
    partial1_score,
    partial2_score,
    final_score,
    partial1_total,
    partial2_total,
    final_total,
    semester_total,
    comment
  } = req.body;

  const updates = [];
  const params = [];

  if (partial1_score !== undefined) {
    updates.push('partial1_score = ?');
    params.push(partial1_score);
  }
  if (partial2_score !== undefined) {
    updates.push('partial2_score = ?');
    params.push(partial2_score);
  }
  if (final_score !== undefined) {
    updates.push('final_score = ?');
    params.push(final_score);
  }
  if (partial1_total !== undefined) {
    updates.push('partial1_total = ?');
    params.push(partial1_total);
  }
  if (partial2_total !== undefined) {
    updates.push('partial2_total = ?');
    params.push(partial2_total);
  }
  if (final_total !== undefined) {
    updates.push('final_total = ?');
    params.push(final_total);
  }
  if (semester_total !== undefined) {
    updates.push('semester_total = ?');
    params.push(semester_total);
  }
  if (comment !== undefined) {
    updates.push('comment = ?');
    params.push(comment || null);
  }

  if (updates.length === 0) {
    return sendErrorResponse(res, 400, 'No fields to update');
  }

  const actorId = getActorEmployeeId(req);
  updates.push('updated_by = ?');
  params.push(actorId);
  params.push(id);

  await query(`UPDATE course_notes SET ${updates.join(', ')} WHERE id = ?`, params);

  const notes = await query('SELECT * FROM course_notes WHERE id = ?', [id]);
  sendSuccessResponse(res, 200, { note: notes[0] }, 'Course note updated successfully');
});

exports.deleteCourseNote = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const existing = await query('SELECT id FROM course_notes WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Course note not found');
  }

  await query('DELETE FROM course_notes WHERE id = ?', [id]);
  sendSuccessResponse(res, 200, null, 'Course note deleted successfully');
});
