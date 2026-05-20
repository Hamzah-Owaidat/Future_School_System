const { query } = require('../config/database');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../utils/helpers');

/**
 * @desc    Get all courses
 * @route   GET /api/courses
 * @access  Private (Admin, Principal, Teacher)
 */
exports.getAllCourses = asyncHandler(async (req, res, next) => {
  const { is_active = '', show_all = '' } = req.query;

  let sql = `
    SELECT *
    FROM courses
    WHERE 1=1
  `;
  const params = [];

  // Filter by deleted_at: show only non-deleted records by default
  if (show_all !== 'true') {
    sql += ` AND deleted_at IS NULL`;
  }

  if (is_active !== '') {
    sql += ` AND is_active = ?`;
    params.push(is_active === 'true' || is_active === true);
  }

  sql += ` ORDER BY name`;

  const courses = await query(sql, params);

  sendSuccessResponse(res, 200, { courses }, 'Courses retrieved successfully');
});

/**
 * @desc    Get single course by ID
 * @route   GET /api/courses/:id
 * @access  Private
 */
exports.getCourseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const courses = await query('SELECT * FROM courses WHERE id = ?', [id]);

  if (courses.length === 0) {
    return sendErrorResponse(res, 404, 'Course not found');
  }

  sendSuccessResponse(res, 200, { course: courses[0] }, 'Course retrieved successfully');
});

/**
 * @desc    Create new course
 * @route   POST /api/courses
 * @access  Private (Admin)
 */
exports.createCourse = asyncHandler(async (req, res, next) => {
  const { name, code, description, is_active } = req.body;

  if (!name || !code) {
    return sendErrorResponse(res, 400, 'Please provide course name and code');
  }

  // Check if code already exists
  const existing = await query('SELECT id FROM courses WHERE code = ?', [code]);
  if (existing.length > 0) {
    return sendErrorResponse(res, 400, 'Course code already exists');
  }

  const result = await query(
    `INSERT INTO courses (name, code, description, is_active, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      name,
      code,
      description || null,
      is_active !== undefined ? is_active : true,
      req.employee.id,
      req.employee.id,
    ]
  );

  const courses = await query('SELECT * FROM courses WHERE id = ?', [result.insertId]);

  sendSuccessResponse(res, 201, { course: courses[0] }, 'Course created successfully');
});

/**
 * @desc    Update course
 * @route   PUT /api/courses/:id
 * @access  Private (Admin)
 */
exports.updateCourse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, code, description, is_active } = req.body;

  // Check if course exists and is not soft deleted
  const existing = await query('SELECT id, deleted_at FROM courses WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Course not found');
  }
  if (existing[0].deleted_at !== null) {
    return sendErrorResponse(res, 403, 'Cannot update a deleted course');
  }

  // Check for duplicate code
  if (code) {
    const duplicate = await query('SELECT id FROM courses WHERE code = ? AND id != ?', [code, id]);
    if (duplicate.length > 0) {
      return sendErrorResponse(res, 400, 'Course code already exists');
    }
  }

  const updates = [];
  const params = [];

  if (name) {
    updates.push('name = ?');
    params.push(name);
  }
  if (code) {
    updates.push('code = ?');
    params.push(code);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
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

  await query(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`, params);

  const courses = await query('SELECT * FROM courses WHERE id = ?', [id]);

  sendSuccessResponse(res, 200, { course: courses[0] }, 'Course updated successfully');
});

/**
 * @desc    Delete course (soft delete)
 * @route   DELETE /api/courses/:id
 * @access  Private (Admin)
 */
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const existing = await query('SELECT id FROM courses WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Course not found');
  }

  // Soft delete (set is_active to false and deleted_at timestamp)
  await query(
    'UPDATE courses SET is_active = FALSE, deleted_at = NOW(), updated_by = ? WHERE id = ?',
    [req.employee.id, id]
  );

  sendSuccessResponse(res, 200, null, 'Course deleted successfully');
});
