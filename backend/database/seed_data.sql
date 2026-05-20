-- FuturSchool seed — run after: npm run migrate
-- Default passwords: password1234 (change in production)

USE futurschool;

-- -----------------------------------------------------------------
-- Permissions
-- -----------------------------------------------------------------
INSERT INTO roles (slug, name, description, is_active, is_system, created_by, updated_by) VALUES
('admin', 'Administrator', 'Full system access', TRUE, TRUE, NULL, NULL),
('principal', 'Principal', 'School leadership', TRUE, TRUE, NULL, NULL),
('teacher', 'Teacher', 'Classroom teacher', TRUE, TRUE, NULL, NULL);

INSERT INTO permissions (code, name, resource, action, description, created_by, updated_by) VALUES
('employee.manage', 'Manage employees', 'employee', 'manage', 'Create/update/delete staff', NULL, NULL),
('employee.read', 'View employees', 'employee', 'read', 'List and view staff', NULL, NULL),
('student.manage', 'Manage students', 'student', 'manage', 'Create/update/delete students', NULL, NULL),
('student.read', 'View students', 'student', 'read', 'List and view students', NULL, NULL),
('class.manage', 'Manage classes', 'class', 'manage', 'Create/update/delete classes', NULL, NULL),
('class.read', 'View classes', 'class', 'read', 'List and view classes', NULL, NULL),
('course.manage', 'Manage courses', 'course', 'manage', 'Catalog and class-course assignments', NULL, NULL),
('course.read', 'View courses', 'course', 'read', 'List courses and assignments', NULL, NULL),
('course_note.manage', 'Manage all course notes', 'course_note', 'manage', 'Full notes/grades access', NULL, NULL),
('course_note.read', 'View course notes', 'course_note', 'read', 'View grades and comments', NULL, NULL),
('course_note.write', 'Edit assigned course notes', 'course_note', 'write', 'Enter grades for assigned classes', NULL, NULL),
('role.manage', 'Manage roles', 'role', 'manage', 'Roles and role-permission mapping', NULL, NULL),
('permission.manage', 'Manage permissions', 'permission', 'manage', 'Permission catalogue', NULL, NULL);

SET @admin_role = (SELECT id FROM roles WHERE slug = 'admin' LIMIT 1);
SET @principal_role = (SELECT id FROM roles WHERE slug = 'principal' LIMIT 1);
SET @teacher_role = (SELECT id FROM roles WHERE slug = 'teacher' LIMIT 1);

-- -----------------------------------------------------------------
-- Admin user + employee
-- -----------------------------------------------------------------
INSERT INTO users (email, password_hash, user_type, is_active) VALUES
('admin@futurschool.com', '$2a$10$Zcb5LOBp15l5piQGsqikEO/MeszmeNvltSDY66nXVxd/KQVvV6Hiu', 'employee', TRUE);

SET @admin_user = (SELECT id FROM users WHERE email = 'admin@futurschool.com' LIMIT 1);

INSERT INTO employees (
  user_id, employee_code, first_name, last_name, email, hire_date, role_id, is_active, created_by, updated_by
) VALUES (
  @admin_user, 'EMP001', 'Admin', 'User', 'admin@futurschool.com', '2024-01-01', @admin_role, TRUE, NULL, NULL
);

SET @admin_emp = (SELECT id FROM employees WHERE employee_code = 'EMP001' LIMIT 1);

INSERT INTO user_roles (user_id, role_id, created_by, updated_by) VALUES (@admin_user, @admin_role, @admin_emp, @admin_emp);

UPDATE roles SET created_by = @admin_emp, updated_by = @admin_emp;
UPDATE permissions SET created_by = @admin_emp, updated_by = @admin_emp;
UPDATE employees SET created_by = @admin_emp, updated_by = @admin_emp WHERE id = @admin_emp;

-- Admin: all permissions
INSERT INTO role_permissions (role_id, permission_id, created_by, updated_by)
SELECT @admin_role, p.id, @admin_emp, @admin_emp FROM permissions p;

-- Principal
INSERT INTO role_permissions (role_id, permission_id, created_by, updated_by)
SELECT @principal_role, p.id, @admin_emp, @admin_emp FROM permissions p
WHERE p.code IN (
  'employee.read', 'student.manage', 'student.read', 'class.manage', 'class.read',
  'course.manage', 'course.read', 'course_note.manage', 'course_note.read'
);

-- Teacher
INSERT INTO role_permissions (role_id, permission_id, created_by, updated_by)
SELECT @teacher_role, p.id, @admin_emp, @admin_emp FROM permissions p
WHERE p.code IN ('student.read', 'class.read', 'course.read', 'course_note.read', 'course_note.write');

-- -----------------------------------------------------------------
-- Sample class, student with portal login
-- -----------------------------------------------------------------
INSERT INTO classes (
  class_name, class_code, grade_level, section, capacity, room_number, academic_year,
  teacher_id, is_active, created_by, updated_by
) VALUES (
  'Grade 1-A', 'G1A', 1, 'A', 30, '101', '2024-2025', NULL, TRUE, @admin_emp, @admin_emp
);

SET @class_id = (SELECT id FROM classes WHERE class_code = 'G1A' AND academic_year = '2024-2025' LIMIT 1);

INSERT INTO users (email, password_hash, user_type, is_active) VALUES
('john.doe@student.futurschool.com', '$2a$10$Zcb5LOBp15l5piQGsqikEO/MeszmeNvltSDY66nXVxd/KQVvV6Hiu', 'student', TRUE);

SET @student_user = (SELECT id FROM users WHERE email = 'john.doe@student.futurschool.com' LIMIT 1);

INSERT INTO students (
  user_id, student_code, first_name, last_name, email, phone, date_of_birth, gender, address,
  parent_name, parent_phone, parent_email, enrollment_date, class_id, is_active, created_by, updated_by
) VALUES (
  @student_user, 'STU000', 'John', 'Doe', 'john.doe@student.futurschool.com', '111-222-3333',
  '2017-03-15', 'male', '100 Student St', 'Jane Doe', '111-222-3334', 'jane.doe@email.com',
  '2024-09-01', @class_id, TRUE, @admin_emp, @admin_emp
);
