# FuturSchool Database Schema

This directory contains the MySQL database schema and seed data for the FuturSchool System.

## Files

- **schema.sql** - Complete database schema with all tables, relationships, and indexes
- **seed_data.sql** - Sample data for testing and initial setup

## Database Structure

### Tables

1. **roles** - User roles (admin, teacher, principal, secretary, student)
2. **permissions** - System permissions (create, read, update, delete for each resource)
3. **role_permissions** - Many-to-many relationship between roles and permissions
4. **employees** - School staff members (teachers, admin, etc.)
5. **classes** - Class/grade levels with teacher assignments
6. **students** - Student information and enrollment
7. **notes** - Notes for each student (academic, behavioral, attendance, general)

### Relationships

- **employees** → **roles** (many-to-one)
- **classes** → **employees** (teacher_id, many-to-one)
- **students** → **classes** (many-to-one)
- **notes** → **students** (many-to-one)
- **notes** → **employees** (many-to-one)
- **role_permissions** → **roles** (many-to-one)
- **role_permissions** → **permissions** (many-to-one)

### Common Columns

All tables include:
- `created_by` - User ID who created the record
- `updated_by` - User ID who last updated the record
- `created_at` - Timestamp when record was created
- `updated_at` - Timestamp when record was last updated (auto-updates)

### Indexes

All foreign keys and commonly queried fields are indexed for optimal performance:
- Foreign key columns
- Unique identifiers (codes, emails)
- Searchable fields (names, dates)
- Composite indexes for common query patterns

## Setup Instructions

### 1. Create Database

```sql
-- Run schema.sql in phpMyAdmin or MySQL command line
mysql -u root -p < database/schema.sql
```

Or import `schema.sql` through phpMyAdmin interface.

### 2. Seed Sample Data (Optional)

```sql
-- Run seed_data.sql for sample data
mysql -u root -p futurschool < database/seed_data.sql
```

Or import `seed_data.sql` through phpMyAdmin interface.

## Column Details

### Roles Table
- `id` - Primary key
- `name` - Unique role name
- `description` - Role description
- `is_active` - Active status

### Permissions Table
- `id` - Primary key
- `name` - Unique permission name
- `resource` - Resource name (student, employee, note, class)
- `action` - Action type (create, read, update, delete, manage)

### Employees Table
- `id` - Primary key
- `employee_code` - Unique employee identifier
- `first_name`, `last_name` - Employee name
- `email` - Unique email address
- `phone` - Contact phone
- `date_of_birth` - DOB
- `gender` - Gender (male, female, other)
- `address` - Physical address
- `hire_date` - Employment start date
- `salary` - Employee salary
- `role_id` - Foreign key to roles table
- `is_active` - Active status

### Classes Table
- `id` - Primary key
- `class_name` - Unique class name (e.g., "Grade 1-A")
- `class_code` - Unique class code (e.g., "G1A")
- `grade_level` - Numeric grade level
- `section` - Section letter (A, B, C)
- `capacity` - Maximum students
- `room_number` - Classroom number
- `academic_year` - Academic year (e.g., "2024-2025")
- `teacher_id` - Foreign key to employees table

### Students Table
- `id` - Primary key
- `student_code` - Unique student identifier
- `first_name`, `last_name` - Student name
- `email` - Student email (optional, unique)
- `phone` - Contact phone
- `date_of_birth` - DOB
- `gender` - Gender
- `address` - Physical address
- `parent_name` - Parent/guardian name
- `parent_phone` - Parent contact phone
- `parent_email` - Parent email
- `enrollment_date` - Enrollment date
- `class_id` - Foreign key to classes table
- `is_active` - Active status

### Notes Table
- `id` - Primary key
- `student_id` - Foreign key to students table
- `employee_id` - Foreign key to employees table (who created the note)
- `title` - Note title
- `content` - Note content
- `note_type` - Type (academic, behavioral, attendance, general)
- `priority` - Priority level (low, medium, high)
- `is_visible_to_parent` - Whether parent can view this note

## Notes

- All timestamps use MySQL `TIMESTAMP` type with automatic defaults
- Foreign keys use appropriate `ON DELETE` actions:
  - `CASCADE` for dependent records (notes when student deleted)
  - `RESTRICT` for critical relationships (employees with roles)
  - `SET NULL` for optional relationships (classes when teacher deleted)
- Indexes are optimized for common query patterns
- All text fields use `utf8mb4` encoding for full Unicode support

