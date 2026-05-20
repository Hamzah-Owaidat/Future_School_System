-- ============================================
-- ALTER Query: Add password field to employees table
-- Run this if the employees table already exists without the password column
-- ============================================

USE futurschool;

ALTER TABLE employees 
ADD COLUMN password VARCHAR(255) NULL COMMENT 'Hashed password for employee login' 
AFTER email;

