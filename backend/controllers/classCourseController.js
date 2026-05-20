const { query } = require('../config/database');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../utils/helpers');

/**
 * @desc    Get class-course assignments
 * @route   GET /api/class-courses
 * @access  Private (Admin, Principal, Teacher)
 */
exports.getClassCourses = asyncHandler(async (req, res, next) => {
  const { class_id = '', course_id = '', teacher_id = '', academic_year = '', is_active = '', show_all = '' } =
    req.query;

  let sql = `
    SELECT cc.*,
           c.name AS course_name,
           c.code AS course_code,
           cl.class_name,
           cl.class_code,
           e.first_name AS teacher_first_name,
           e.last_name AS teacher_last_name,
           e.employee_code AS teacher_code
    FROM class_courses cc
    INNER JOIN courses c ON cc.course_id = c.id
    INNER JOIN classes cl ON cc.class_id = cl.id
    INNER JOIN employees e ON cc.teacher_id = e.id
    WHERE 1=1
  `;
  const params = [];

  // Filter by deleted_at: show only non-deleted records by default
  if (show_all !== 'true') {
    sql += ` AND cc.deleted_at IS NULL`;
  }

  if (class_id) {
    sql += ` AND cc.class_id = ?`;
    params.push(parseInt(class_id));
  }

  if (course_id) {
    sql += ` AND cc.course_id = ?`;
    params.push(parseInt(course_id));
  }

  if (teacher_id) {
    sql += ` AND cc.teacher_id = ?`;
    params.push(parseInt(teacher_id));
  }

  if (academic_year) {
    sql += ` AND cc.academic_year = ?`;
    params.push(academic_year);
  }

  if (is_active !== '') {
    sql += ` AND cc.is_active = ?`;
    params.push(is_active === 'true' || is_active === true);
  }

  sql += ` ORDER BY cl.class_name, c.name`;

  const assignments = await query(sql, params);

  sendSuccessResponse(res, 200, { assignments }, 'Class-course assignments retrieved');
});

/**
 * @desc    Get single class-course assignment by ID
 * @route   GET /api/class-courses/:id
 * @access  Private (Admin, Principal, Teacher)
 */
exports.getClassCourseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log('getClassCourseById called with id:', id);

  const assignments = await query(
    `SELECT cc.*,
            c.name AS course_name,
            c.code AS course_code,
            cl.class_name,
            cl.class_code,
            e.first_name AS teacher_first_name,
            e.last_name AS teacher_last_name,
            e.employee_code AS teacher_code
     FROM class_courses cc
     INNER JOIN courses c ON cc.course_id = c.id
     INNER JOIN classes cl ON cc.class_id = cl.id
     INNER JOIN employees e ON cc.teacher_id = e.id
     WHERE cc.id = ?`,
    [id]
  );

  if (assignments.length === 0) {
    return sendErrorResponse(res, 404, 'Class-course assignment not found');
  }

  sendSuccessResponse(res, 200, { assignment: assignments[0] }, 'Assignment retrieved successfully');
});

/**
 * @desc    Create class-course assignment
 * @route   POST /api/class-courses
 * @access  Private (Admin)
 */
exports.createClassCourse = asyncHandler(async (req, res, next) => {
  const { class_id, course_id, teacher_id, academic_year, is_active } = req.body;

  if (!class_id || !course_id || !teacher_id || !academic_year) {
    return sendErrorResponse(res, 400, 'Please provide class_id, course_id, teacher_id, academic_year');
  }

  // Validate class
  const classes = await query('SELECT id FROM classes WHERE id = ?', [class_id]);
  if (classes.length === 0) {
    return sendErrorResponse(res, 400, 'Class not found');
  }

  // Validate course
  const courses = await query('SELECT id FROM courses WHERE id = ? AND is_active = TRUE', [course_id]);
  if (courses.length === 0) {
    return sendErrorResponse(res, 400, 'Course not found or inactive');
  }

  // Validate teacher
  const teachers = await query(
    'SELECT id FROM employees WHERE id = ? AND is_active = TRUE',
    [teacher_id]
  );
  if (teachers.length === 0) {
    return sendErrorResponse(res, 400, 'Teacher not found or inactive');
  }

  // Check for existing assignment for this class/course/year
  const existing = await query(
    `SELECT id FROM class_courses
     WHERE class_id = ? AND course_id = ? AND academic_year = ?`,
    [class_id, course_id, academic_year]
  );
  if (existing.length > 0) {
    return sendErrorResponse(res, 400, 'Assignment already exists for this class/course/year');
  }

  const result = await query(
    `INSERT INTO class_courses
     (class_id, course_id, teacher_id, academic_year, is_active, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      class_id,
      course_id,
      teacher_id,
      academic_year,
      is_active !== undefined ? is_active : true,
      req.employee.id,
      req.employee.id,
    ]
  );

  const assignments = await query(
    `SELECT cc.*,
            c.name AS course_name,
            c.code AS course_code,
            cl.class_name,
            cl.class_code,
            e.first_name AS teacher_first_name,
            e.last_name AS teacher_last_name,
            e.employee_code AS teacher_code
     FROM class_courses cc
     INNER JOIN courses c ON cc.course_id = c.id
     INNER JOIN classes cl ON cc.class_id = cl.id
     INNER JOIN employees e ON cc.teacher_id = e.id
     WHERE cc.id = ?`,
    [result.insertId]
  );

  sendSuccessResponse(res, 201, { assignment: assignments[0] }, 'Assignment created successfully');
});

/**
 * @desc    Update class-course assignment
 * @route   PUT /api/class-courses/:id
 * @access  Private (Admin)
 */
exports.updateClassCourse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { teacher_id, academic_year, is_active } = req.body;

  // Check if assignment exists and is not soft deleted
  const existing = await query('SELECT *, deleted_at FROM class_courses WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Assignment not found');
  }
  const current = existing[0];
  if (current.deleted_at !== null) {
    return sendErrorResponse(res, 403, 'Cannot update a deleted assignment');
  }

  // Validate teacher if changed
  if (teacher_id) {
    const teachers = await query(
      'SELECT id FROM employees WHERE id = ? AND is_active = TRUE',
      [teacher_id]
    );
    if (teachers.length === 0) {
      return sendErrorResponse(res, 400, 'Teacher not found or inactive');
    }
  }

  const newAcademicYear = academic_year || current.academic_year;
  const newTeacherId = teacher_id || current.teacher_id;

  // Ensure uniqueness constraint not violated
  const duplicate = await query(
    `SELECT id FROM class_courses
     WHERE class_id = ? AND course_id = ? AND academic_year = ? AND id != ?`,
    [current.class_id, current.course_id, newAcademicYear, id]
  );
  if (duplicate.length > 0) {
    return sendErrorResponse(res, 400, 'Another assignment already exists for this class/course/year');
  }

  const updates = [];
  const params = [];

  if (teacher_id) {
    updates.push('teacher_id = ?');
    params.push(teacher_id);
  }
  if (academic_year) {
    updates.push('academic_year = ?');
    params.push(academic_year);
  }
  if (is_active !== undefined) {
    updates.push('is_active = ?');
    params.push(is_active);
  }

  updates.push('updated_by = ?');
  params.push(req.employee.id);
  params.push(id);

  if (updates.length <= 1) {
    return sendErrorResponse(res, 400, 'No fields to update');
  }

  await query(`UPDATE class_courses SET ${updates.join(', ')} WHERE id = ?`, params);

  const assignments = await query(
    `SELECT cc.*,
            c.name AS course_name,
            c.code AS course_code,
            cl.class_name,
            cl.class_code,
            e.first_name AS teacher_first_name,
            e.last_name AS teacher_last_name,
            e.employee_code AS teacher_code
     FROM class_courses cc
     INNER JOIN courses c ON cc.course_id = c.id
     INNER JOIN classes cl ON cc.class_id = cl.id
     INNER JOIN employees e ON cc.teacher_id = e.id
     WHERE cc.id = ?`,
    [id]
  );

  sendSuccessResponse(res, 200, { assignment: assignments[0] }, 'Assignment updated successfully');
});

/**
 * @desc    Delete class-course assignment (soft delete)
 * @route   DELETE /api/class-courses/:id
 * @access  Private (Admin)
 */
exports.deleteClassCourse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const existing = await query('SELECT id FROM class_courses WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Assignment not found');
  }

  // Soft delete (set is_active to false and deleted_at timestamp)
  await query(
    'UPDATE class_courses SET is_active = FALSE, deleted_at = NOW(), updated_by = ? WHERE id = ?',
    [req.employee.id, id]
  );

  sendSuccessResponse(res, 200, null, 'Assignment deleted successfully');
});


