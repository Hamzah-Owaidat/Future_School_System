-- ============================================
-- Migration: Add password field to employees table
-- ============================================
-- IMPORTANT: After running this migration, run the setup-passwords.js script
-- to set initial passwords for existing employees

USE futurschool;

-- Add password column to employees table
-- Using NULL initially to allow existing records, then we'll set passwords via script
ALTER TABLE employees 
ADD COLUMN password VARCHAR(255) NULL AFTER email;

-- Note: After running this migration, execute:
-- node scripts/setup-passwords.js
-- This will set a default password for all employees (password: "password123")
-- Employees should change their password after first login

