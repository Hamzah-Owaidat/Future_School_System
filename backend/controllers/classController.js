const { query } = require('../config/database');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../utils/helpers');

/**
 * @desc    Get all classes
 * @route   GET /api/classes
 * @access  Private
 */
exports.getAllClasses = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, search = '', grade_level = '', academic_year = '', is_active = '', show_all = '' } = req.query;
  
  // Ensure proper integer conversion
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const offset = (pageNum - 1) * limitNum;

  let sql = `
    SELECT c.*, 
           e.id as teacher_id, 
           e.first_name as teacher_first_name, 
           e.last_name as teacher_last_name,
           e.employee_code as teacher_code,
           (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.is_active = TRUE) as student_count
    FROM classes c
    LEFT JOIN employees e ON c.teacher_id = e.id
    WHERE 1=1
  `;
  const params = [];

  // Filter by deleted_at: show only non-deleted records by default
  if (show_all !== 'true') {
    sql += ` AND c.deleted_at IS NULL`;
  }

  if (search) {
    sql += ` AND (c.class_name LIKE ? OR c.class_code LIKE ? OR c.room_number LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (grade_level) {
    sql += ` AND c.grade_level = ?`;
    params.push(parseInt(grade_level));
  }

  if (academic_year) {
    sql += ` AND c.academic_year = ?`;
    params.push(academic_year);
  }

  if (is_active !== '') {
    sql += ` AND c.is_active = ?`;
    params.push(is_active === 'true' || is_active === true);
  }

  // Use template literal for LIMIT/OFFSET to avoid parameter issues
  sql += ` ORDER BY c.grade_level, c.section LIMIT ${limitNum} OFFSET ${offset}`;

  const classes = await query(sql, params);

  // Get total count
  let countSql = `SELECT COUNT(*) as total FROM classes WHERE 1=1`;
  const countParams = [];

  // Apply same deleted_at filter to count query
  if (show_all !== 'true') {
    countSql += ` AND deleted_at IS NULL`;
  }

  if (search) {
    countSql += ` AND (class_name LIKE ? OR class_code LIKE ? OR room_number LIKE ?)`;
    const searchTerm = `%${search}%`;
    countParams.push(searchTerm, searchTerm, searchTerm);
  }

  if (grade_level) {
    countSql += ` AND grade_level = ?`;
    countParams.push(parseInt(grade_level));
  }

  if (academic_year) {
    countSql += ` AND academic_year = ?`;
    countParams.push(academic_year);
  }

  if (is_active !== '') {
    countSql += ` AND is_active = ?`;
    countParams.push(is_active === 'true' || is_active === true);
  }

  const countResult = await query(countSql, countParams);
  const total = countResult[0].total;

  sendSuccessResponse(res, 200, {
    classes,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  }, 'Classes retrieved successfully');
});

/**
 * @desc    Get single class by ID
 * @route   GET /api/classes/:id
 * @access  Private
 */
exports.getClassById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const classes = await query(
    `SELECT c.*, 
            e.id as teacher_id, 
            e.first_name as teacher_first_name, 
            e.last_name as teacher_last_name,
            e.employee_code as teacher_code,
            (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.is_active = TRUE) as student_count
     FROM classes c
     LEFT JOIN employees e ON c.teacher_id = e.id
     WHERE c.id = ?`,
    [id]
  );

  if (classes.length === 0) {
    return sendErrorResponse(res, 404, 'Class not found');
  }

  sendSuccessResponse(res, 200, { class: classes[0] }, 'Class retrieved successfully');
});

/**
 * @desc    Create new class
 * @route   POST /api/classes
 * @access  Private (Admin)
 */
exports.createClass = asyncHandler(async (req, res, next) => {
  const {
    class_name,
    class_code,
    grade_level,
    section,
    capacity,
    room_number,
    academic_year,
    teacher_id
  } = req.body;

  // Validate required fields
  if (!class_name || !class_code || !grade_level || !academic_year) {
    return sendErrorResponse(res, 400, 'Please provide all required fields');
  }

  // Check if class_name or class_code already exists
  const existing = await query(
    'SELECT id FROM classes WHERE class_name = ? OR class_code = ?',
    [class_name, class_code]
  );

  if (existing.length > 0) {
    return sendErrorResponse(res, 400, 'Class name or code already exists');
  }

  // Validate teacher if provided
  if (teacher_id) {
    const teacher = await query(
      'SELECT id, is_active FROM employees WHERE id = ? AND is_active = TRUE',
      [teacher_id]
    );
    if (teacher.length === 0) {
      return sendErrorResponse(res, 400, 'Teacher not found or inactive');
    }
  }

  // Validate capacity is positive
  if (capacity !== undefined && capacity !== null && (isNaN(capacity) || capacity < 1)) {
    return sendErrorResponse(res, 400, 'Capacity must be a positive number');
  }

  // Insert class
  const result = await query(
    `INSERT INTO classes 
     (class_name, class_code, grade_level, section, capacity, room_number, 
      academic_year, teacher_id, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      class_name,
      class_code,
      grade_level,
      section || null,
      capacity || 30,
      room_number || null,
      academic_year,
      teacher_id || null,
      req.employee.id,
      req.employee.id
    ]
  );

  // Get created class
  const classes = await query(
    `SELECT c.*, 
            e.id as teacher_id, 
            e.first_name as teacher_first_name, 
            e.last_name as teacher_last_name,
            e.employee_code as teacher_code
     FROM classes c
     LEFT JOIN employees e ON c.teacher_id = e.id
     WHERE c.id = ?`,
    [result.insertId]
  );

  sendSuccessResponse(res, 201, { class: classes[0] }, 'Class created successfully');
});

/**
 * @desc    Update class
 * @route   PUT /api/classes/:id
 * @access  Private (Admin)
 */
exports.updateClass = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    class_name,
    class_code,
    grade_level,
    section,
    capacity,
    room_number,
    academic_year,
    teacher_id,
    is_active
  } = req.body;

  // Check if class exists and is not soft deleted
  const existing = await query('SELECT id, deleted_at FROM classes WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Class not found');
  }
  if (existing[0].deleted_at !== null) {
    return sendErrorResponse(res, 403, 'Cannot update a deleted class');
  }

  // Check if class_name or class_code already exists (excluding current class)
  if (class_name || class_code) {
    const conditions = [];
    const checkParams = [];
    
    if (class_name) {
      conditions.push('class_name = ?');
      checkParams.push(class_name);
    }
    
    if (class_code) {
      conditions.push('class_code = ?');
      checkParams.push(class_code);
    }
    
    if (conditions.length > 0) {
      checkParams.push(id);
      const duplicate = await query(
        `SELECT id FROM classes WHERE (${conditions.join(' OR ')}) AND id != ?`,
        checkParams
      );
      if (duplicate.length > 0) {
        return sendErrorResponse(res, 400, 'Class name or code already exists');
      }
    }
  }

  // Build update query
  const updates = [];
  const params = [];

  if (class_name) { updates.push('class_name = ?'); params.push(class_name); }
  if (class_code) { updates.push('class_code = ?'); params.push(class_code); }
  if (grade_level) { updates.push('grade_level = ?'); params.push(grade_level); }
  if (section !== undefined) { updates.push('section = ?'); params.push(section); }
  if (capacity !== undefined) { updates.push('capacity = ?'); params.push(capacity); }
  if (room_number !== undefined) { updates.push('room_number = ?'); params.push(room_number); }
  if (academic_year) { updates.push('academic_year = ?'); params.push(academic_year); }
  if (teacher_id !== undefined) { updates.push('teacher_id = ?'); params.push(teacher_id); }
  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

  updates.push('updated_by = ?');
  params.push(req.employee.id);
  params.push(id);

  // Check if there are any updates (besides updated_by)
  if (updates.length <= 1) {
    return sendErrorResponse(res, 400, 'No fields to update');
  }

  await query(`UPDATE classes SET ${updates.join(', ')} WHERE id = ?`, params);

  // Get updated class
  const classes = await query(
    `SELECT c.*, 
            e.id as teacher_id, 
            e.first_name as teacher_first_name, 
            e.last_name as teacher_last_name,
            e.employee_code as teacher_code
     FROM classes c
     LEFT JOIN employees e ON c.teacher_id = e.id
     WHERE c.id = ?`,
    [id]
  );

  sendSuccessResponse(res, 200, { class: classes[0] }, 'Class updated successfully');
});

/**
 * @desc    Delete class
 * @route   DELETE /api/classes/:id
 * @access  Private (Admin)
 */
exports.deleteClass = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check if class exists
  const existing = await query('SELECT id FROM classes WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Class not found');
  }

  // Soft delete (set is_active to false and deleted_at timestamp)
  await query(
    'UPDATE classes SET is_active = FALSE, deleted_at = NOW(), updated_by = ? WHERE id = ?',
    [req.employee.id, id]
  );

  sendSuccessResponse(res, 200, null, 'Class deleted successfully');
});

