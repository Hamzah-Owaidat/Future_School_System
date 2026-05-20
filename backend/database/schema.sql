-- ============================================
-- FuturSchool System Database Schema
-- MySQL Database Creation Script
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS futurschool CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE futurschool;

-- ============================================
-- 1. ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether the role is active',
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. PERMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. ROLE_PERMISSIONS TABLE (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id),
    INDEX idx_role_id (role_id),
    INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_code VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female') DEFAULT 'male',
    address TEXT,
    hire_date DATE NOT NULL,
    salary DECIMAL(10, 2),
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_employee_code (employee_code),
    INDEX idx_email (email),
    INDEX idx_role_id (role_id),
    INDEX idx_is_active (is_active),
    INDEX idx_full_name (first_name, last_name),
    INDEX idx_hire_date (hire_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. CLASSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL UNIQUE,
    class_code VARCHAR(20) NOT NULL UNIQUE,
    grade_level INT NOT NULL,
    section VARCHAR(10),
    capacity INT DEFAULT 30,
    room_number VARCHAR(20),
    academic_year VARCHAR(20) NOT NULL,
    teacher_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_class_name (class_name),
    INDEX idx_class_code (class_code),
    INDEX idx_grade_level (grade_level),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_academic_year (academic_year),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. STUDENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_code VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female') DEFAULT 'male',
    address TEXT,
    parent_name VARCHAR(200),
    parent_phone VARCHAR(20),
    parent_email VARCHAR(100),
    enrollment_date DATE NOT NULL,
    class_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    INDEX idx_student_code (student_code),
    INDEX idx_email (email),
    INDEX idx_class_id (class_id),
    INDEX idx_is_active (is_active),
    INDEX idx_full_name (first_name, last_name),
    INDEX idx_enrollment_date (enrollment_date),
    INDEX idx_parent_phone (parent_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. COURSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course_name (name),
    INDEX idx_course_code (code),
    INDEX idx_course_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. CLASS_COURSES TABLE (Course assignments per class & teacher)
-- ============================================
CREATE TABLE IF NOT EXISTS class_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL COMMENT 'Main teacher for this course in this class',
    academic_year VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES employees(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_class_course_teacher (class_id, course_id, academic_year),
    INDEX idx_class_courses_class (class_id),
    INDEX idx_class_courses_course (course_id),
    INDEX idx_class_courses_teacher (teacher_id),
    INDEX idx_class_courses_year (academic_year),
    INDEX idx_class_courses_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. COURSE_NOTES TABLE (Per student, per course, per semester)
-- ============================================
CREATE TABLE IF NOT EXISTS course_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester TINYINT NOT NULL COMMENT '1, 2, or 3',
    -- Scores for each assessment in the semester
    partial1_score DECIMAL(5,2) DEFAULT 0,
    partial2_score DECIMAL(5,2) DEFAULT 0,
    final_score DECIMAL(5,2) DEFAULT 0,
    -- Totals (max points) for each assessment
    partial1_total DECIMAL(5,2) DEFAULT 0,
    partial2_total DECIMAL(5,2) DEFAULT 0,
    final_total DECIMAL(5,2) DEFAULT 0,
    -- Computed semester total (can be updated by app logic)
    semester_total DECIMAL(5,2) DEFAULT 0,
    comment TEXT,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES employees(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_student_course_semester (student_id, class_id, course_id, academic_year, semester),
    INDEX idx_course_notes_student (student_id),
    INDEX idx_course_notes_class (class_id),
    INDEX idx_course_notes_course (course_id),
    INDEX idx_course_notes_teacher (teacher_id),
    INDEX idx_course_notes_year_sem (academic_year, semester)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ADD FOREIGN KEY CONSTRAINTS FOR created_by/updated_by
-- (Optional: If you want to track which user created/updated records)
-- ============================================
-- Note: These are commented out as they would create circular dependencies
-- You can uncomment and create a users table if needed, or use employee_id
ALTER TABLE roles ADD FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE roles ADD FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE permissions ADD FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE permissions ADD FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE role_permissions ADD FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE role_permissions ADD FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE employees ADD FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE employees ADD FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE classes ADD FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE classes ADD FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE students ADD FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE students ADD FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE courses ADD FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE courses ADD FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE class_courses ADD FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE class_courses ADD FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE course_notes ADD FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE course_notes ADD FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
