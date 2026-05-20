-- ============================================
-- FuturSchool System - Simple Seed Data
-- Minimal data for initial setup
-- ============================================
-- IMPORTANT: Run this ENTIRE script from the beginning in one go!
-- 
-- NOTE: We use NULL for created_by/updated_by initially to avoid circular dependency
-- Then update them after employees are created
-- ============================================

USE futurschool;

-- ============================================
-- 1. INSERT ADMIN ROLE
-- ============================================
INSERT INTO roles (name, description, is_active, created_by, updated_by) VALUES
('admin', 'System Administrator with full access', TRUE, NULL, NULL);

-- ============================================
-- 2. INSERT BASIC PERMISSIONS FOR ADMIN
-- ============================================
INSERT INTO permissions (name, resource, action, description, created_by, updated_by) VALUES
-- Admin management permissions
('manage_employees', 'employee', 'manage', 'Manage employees', NULL, NULL),
('manage_students', 'student', 'manage', 'Manage students', NULL, NULL),
('manage_classes', 'class', 'manage', 'Manage classes', NULL, NULL),
('manage_courses', 'course', 'manage', 'Manage courses', NULL, NULL),
('manage_roles', 'role', 'manage', 'Manage roles and permissions', NULL, NULL);

-- ============================================
-- 3. INSERT ADMIN EMPLOYEE
-- ============================================
INSERT INTO employees (employee_code, first_name, last_name, email, phone, date_of_birth, gender, address, hire_date, salary, role_id, is_active, created_by, updated_by) VALUES
('EMP001', 'Admin', 'User', 'admin@futurschool.com', '123-456-7890', '1980-01-01', 'male', '123 Admin St, City', '2024-01-01', 50000.00, (SELECT id FROM roles WHERE name = 'admin' LIMIT 1), TRUE, NULL, NULL);

-- ============================================
-- 4. UPDATE ROLES AND PERMISSIONS with created_by/updated_by
-- ============================================
SET @admin_employee_id = (SELECT id FROM employees WHERE employee_code = 'EMP001' LIMIT 1);

UPDATE roles SET created_by = @admin_employee_id, updated_by = @admin_employee_id;
UPDATE permissions SET created_by = @admin_employee_id, updated_by = @admin_employee_id;
UPDATE employees SET created_by = @admin_employee_id, updated_by = @admin_employee_id WHERE employee_code = 'EMP001';

-- ============================================
-- 5. ASSIGN ALL PERMISSIONS TO ADMIN ROLE
-- ============================================
INSERT INTO role_permissions (role_id, permission_id, created_by, updated_by)
SELECT (SELECT id FROM roles WHERE name = 'admin' LIMIT 1), id, @admin_employee_id, @admin_employee_id FROM permissions;

-- ============================================
-- 6. INSERT ONE SAMPLE CLASS
-- ============================================
INSERT INTO classes (class_name, class_code, grade_level, section, capacity, room_number, academic_year, teacher_id, is_active, created_by, updated_by) VALUES
('Grade 1-A', 'G1A', 1, 'A', 30, '101', '2024-2025', NULL, TRUE, @admin_employee_id, @admin_employee_id);

-- ============================================
-- 7. INSERT ONE SAMPLE STUDENT
-- ============================================
INSERT INTO students (student_code, first_name, last_name, email, phone, date_of_birth, gender, address, parent_name, parent_phone, parent_email, enrollment_date, class_id, is_active, created_by, updated_by) VALUES
('STU001', 'John', 'Doe', 'john.doe@student.futurschool.com', '111-222-3333', '2017-03-15', 'male', '100 Student St, City', 'Jane Doe', '111-222-3334', 'jane.doe@email.com', '2024-09-01', (SELECT id FROM classes WHERE class_code = 'G1A' LIMIT 1), TRUE, @admin_employee_id, @admin_employee_id);
