const { query } = require('../config/database');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../utils/helpers');

/**
 * @desc    Get all students
 * @route   GET /api/students
 * @access  Private
 */
exports.getAllStudents = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, search = '', class_id = '', is_active = '', show_all = '' } = req.query;
  
  // Ensure proper integer conversion
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const offset = (pageNum - 1) * limitNum;

  let sql = `
    SELECT s.*, 
           c.class_name, 
           c.class_code,
           c.grade_level
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE 1=1
  `;
  const params = [];

  // Filter by deleted_at: show only non-deleted records by default
  if (show_all !== 'true') {
    sql += ` AND s.deleted_at IS NULL`;
  }

  if (search) {
    sql += ` AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.email LIKE ? OR s.student_code LIKE ? OR s.parent_name LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (class_id) {
    sql += ` AND s.class_id = ?`;
    params.push(parseInt(class_id));
  }

  if (is_active !== '') {
    sql += ` AND s.is_active = ?`;
    params.push(is_active === 'true' || is_active === true);
  }

  // Use template literal for LIMIT/OFFSET to avoid parameter issues
  sql += ` ORDER BY s.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

  const students = await query(sql, params);

  // Get total count
  let countSql = `SELECT COUNT(*) as total FROM students WHERE 1=1`;
  const countParams = [];

  // Apply same deleted_at filter to count query
  if (show_all !== 'true') {
    countSql += ` AND deleted_at IS NULL`;
  }

  if (search) {
    countSql += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR student_code LIKE ? OR parent_name LIKE ?)`;
    const searchTerm = `%${search}%`;
    countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (class_id) {
    countSql += ` AND class_id = ?`;
    countParams.push(parseInt(class_id));
  }

  if (is_active !== '') {
    countSql += ` AND is_active = ?`;
    countParams.push(is_active === 'true' || is_active === true);
  }

  const countResult = await query(countSql, countParams);
  const total = countResult[0].total;

  sendSuccessResponse(res, 200, {
    students,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  }, 'Students retrieved successfully');
});

/**
 * @desc    Get single student by ID
 * @route   GET /api/students/:id
 * @access  Private
 */
exports.getStudentById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const students = await query(
    `SELECT s.*, 
            c.class_name, 
            c.class_code,
            c.grade_level
     FROM students s
     LEFT JOIN classes c ON s.class_id = c.id
     WHERE s.id = ?`,
    [id]
  );

  if (students.length === 0) {
    return sendErrorResponse(res, 404, 'Student not found');
  }

  sendSuccessResponse(res, 200, { student: students[0] }, 'Student retrieved successfully');
});

/**
 * @desc    Create new student
 * @route   POST /api/students
 * @access  Private (Admin)
 */
exports.createStudent = asyncHandler(async (req, res, next) => {
  const {
    student_code,
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    gender,
    address,
    parent_name,
    parent_phone,
    parent_email,
    enrollment_date,
    class_id
  } = req.body;

  // Validate required fields
  if (!student_code || !first_name || !last_name || !date_of_birth || !enrollment_date) {
    return sendErrorResponse(res, 400, 'Please provide all required fields');
  }

  // Check if student_code or email already exists
  const checkConditions = ['student_code = ?'];
  const checkParams = [student_code];
  
  if (email) {
    checkConditions.push('email = ?');
    checkParams.push(email);
  }
  
  const existing = await query(
    `SELECT id FROM students WHERE ${checkConditions.join(' OR ')}`,
    checkParams
  );

  if (existing.length > 0) {
    return sendErrorResponse(res, 400, 'Student code or email already exists');
  }

  // Insert student
  const result = await query(
    `INSERT INTO students 
     (student_code, first_name, last_name, email, phone, date_of_birth, gender, 
      address, parent_name, parent_phone, parent_email, enrollment_date, class_id, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      student_code,
      first_name,
      last_name,
      email || null,
      phone || null,
      date_of_birth,
      gender || 'other',
      address || null,
      parent_name || null,
      parent_phone || null,
      parent_email || null,
      enrollment_date,
      class_id || null,
      req.employee.id,
      req.employee.id
    ]
  );

  // Get created student
  const students = await query(
    `SELECT s.*, 
            c.class_name, 
            c.class_code,
            c.grade_level
     FROM students s
     LEFT JOIN classes c ON s.class_id = c.id
     WHERE s.id = ?`,
    [result.insertId]
  );

  sendSuccessResponse(res, 201, { student: students[0] }, 'Student created successfully');
});

/**
 * @desc    Update student
 * @route   PUT /api/students/:id
 * @access  Private (Admin)
 */
exports.updateStudent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    student_code,
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    gender,
    address,
    parent_name,
    parent_phone,
    parent_email,
    enrollment_date,
    class_id,
    is_active
  } = req.body;

  // Check if student exists and is not soft deleted
  const existing = await query('SELECT id, deleted_at FROM students WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Student not found');
  }
  if (existing[0].deleted_at !== null) {
    return sendErrorResponse(res, 403, 'Cannot update a deleted student');
  }

  // Check if student_code or email already exists (excluding current student)
  if (student_code || email) {
    const conditions = [];
    const checkParams = [];
    
    if (student_code) {
      conditions.push('student_code = ?');
      checkParams.push(student_code);
    }
    
    if (email) {
      conditions.push('email = ?');
      checkParams.push(email);
    }
    
    if (conditions.length > 0) {
      checkParams.push(id);
      const duplicate = await query(
        `SELECT id FROM students WHERE (${conditions.join(' OR ')}) AND id != ?`,
        checkParams
      );
      if (duplicate.length > 0) {
        return sendErrorResponse(res, 400, 'Student code or email already exists');
      }
    }
  }

  // Build update query
  const updates = [];
  const params = [];

  if (student_code) { updates.push('student_code = ?'); params.push(student_code); }
  if (first_name) { updates.push('first_name = ?'); params.push(first_name); }
  if (last_name) { updates.push('last_name = ?'); params.push(last_name); }
  if (email !== undefined) { updates.push('email = ?'); params.push(email); }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
  if (date_of_birth) { updates.push('date_of_birth = ?'); params.push(date_of_birth); }
  if (gender) { updates.push('gender = ?'); params.push(gender); }
  if (address !== undefined) { updates.push('address = ?'); params.push(address); }
  if (parent_name !== undefined) { updates.push('parent_name = ?'); params.push(parent_name); }
  if (parent_phone !== undefined) { updates.push('parent_phone = ?'); params.push(parent_phone); }
  if (parent_email !== undefined) { updates.push('parent_email = ?'); params.push(parent_email); }
  if (enrollment_date) { updates.push('enrollment_date = ?'); params.push(enrollment_date); }
  if (class_id !== undefined) { updates.push('class_id = ?'); params.push(class_id); }
  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

  updates.push('updated_by = ?');
  params.push(req.employee.id);
  params.push(id);

  // Check if there are any updates (besides updated_by)
  if (updates.length <= 1) {
    return sendErrorResponse(res, 400, 'No fields to update');
  }

  await query(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`, params);

  // Get updated student
  const students = await query(
    `SELECT s.*, 
            c.class_name, 
            c.class_code,
            c.grade_level
     FROM students s
     LEFT JOIN classes c ON s.class_id = c.id
     WHERE s.id = ?`,
    [id]
  );

  sendSuccessResponse(res, 200, { student: students[0] }, 'Student updated successfully');
});

/**
 * @desc    Delete student
 * @route   DELETE /api/students/:id
 * @access  Private (Admin)
 */
exports.deleteStudent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check if student exists
  const existing = await query('SELECT id FROM students WHERE id = ?', [id]);
  if (existing.length === 0) {
    return sendErrorResponse(res, 404, 'Student not found');
  }

  // Soft delete (set is_active to false and deleted_at timestamp)
  await query(
    'UPDATE students SET is_active = FALSE, deleted_at = NOW(), updated_by = ? WHERE id = ?',
    [req.employee.id, id]
  );

  sendSuccessResponse(res, 200, null, 'Student deleted successfully');
});

