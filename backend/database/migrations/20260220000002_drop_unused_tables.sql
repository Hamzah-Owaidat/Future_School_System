-- Remove tables not referenced by the API (permissions via role_permissions only; class via students.class_id).
SET NAMES utf8mb4;

DROP TABLE IF EXISTS student_enrollments;
DROP TABLE IF EXISTS user_permissions;
