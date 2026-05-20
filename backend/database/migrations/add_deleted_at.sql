-- ============================================
-- Migration: Add deleted_at column to all tables with soft delete
-- ============================================
-- This adds a deleted_at timestamp column to track when records were soft deleted
-- Run this after your initial schema setup

USE futurschool;

-- ============================================
-- 1. ROLES TABLE
-- ============================================
ALTER TABLE roles 
ADD COLUMN deleted_at TIMESTAMP NULL COMMENT 'Timestamp when role was soft deleted' 
AFTER is_active;

CREATE INDEX idx_roles_deleted_at ON roles(deleted_at);

-- ============================================
-- 2. PERMISSIONS TABLE
-- ============================================
-- Note: Permissions table doesn't have is_active, but we can add deleted_at for consistency
-- If you want to add soft delete to permissions, uncomment below:
-- ALTER TABLE permissions 
-- ADD COLUMN deleted_at TIMESTAMP NULL COMMENT 'Timestamp when permission was soft deleted' 
-- AFTER updated_at;
-- CREATE INDEX idx_permissions_deleted_at ON permissions(deleted_at);

-- ============================================
-- 3. EMPLOYEES TABLE
-- ============================================
ALTER TABLE employees 
ADD COLUMN deleted_at TIMESTAMP NULL COMMENT 'Timestamp when employee was soft deleted' 
AFTER is_active;

CREATE INDEX idx_employees_deleted_at ON employees(deleted_at);

-- ============================================
-- 4. CLASSES TABLE
-- ============================================
ALTER TABLE classes 
ADD COLUMN deleted_at TIMESTAMP NULL COMMENT 'Timestamp when class was soft deleted' 
AFTER is_active;

CREATE INDEX idx_classes_deleted_at ON classes(deleted_at);

-- ============================================
-- 5. STUDENTS TABLE
-- ============================================
ALTER TABLE students 
ADD COLUMN deleted_at TIMESTAMP NULL COMMENT 'Timestamp when student was soft deleted' 
AFTER is_active;

CREATE INDEX idx_students_deleted_at ON students(deleted_at);

-- ============================================
-- 6. COURSES TABLE
-- ============================================
ALTER TABLE courses 
ADD COLUMN deleted_at TIMESTAMP NULL COMMENT 'Timestamp when course was soft deleted' 
AFTER is_active;

CREATE INDEX idx_courses_deleted_at ON courses(deleted_at);

-- ============================================
-- 7. CLASS_COURSES TABLE
-- ============================================
ALTER TABLE class_courses 
ADD COLUMN deleted_at TIMESTAMP NULL COMMENT 'Timestamp when assignment was soft deleted' 
AFTER is_active;

CREATE INDEX idx_class_courses_deleted_at ON class_courses(deleted_at);

-- ============================================
-- Note: course_notes table doesn't have soft delete (uses hard delete)
-- If you want to add soft delete to course_notes, you would need to:
-- 1. Add is_active column first
-- 2. Then add deleted_at column
-- ============================================
