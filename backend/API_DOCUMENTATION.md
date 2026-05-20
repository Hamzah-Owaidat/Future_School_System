# FuturSchool System API Documentation

**Base URL:** `http://localhost:8080/api` (or your backend URL)

**Authentication:** JWT Token in `Authorization` header: `Bearer <token>`

---

## 🔐 Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@futurschool.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "employee": { "id": 1, "email": "...", "role": "admin" }
  }
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

---

## 👥 Employees

**Access:** Admin, Principal (GET), Admin only (POST/PUT/DELETE)

### List Employees
```http
GET /api/employees?page=1&limit=10&search=john&role_id=2&is_active=true
```

### Get Employee
```http
GET /api/employees/:id
```

### Create Employee
```http
POST /api/employees
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "role_id": 2,
  "hire_date": "2024-01-15",
  "phone": "123-456-7890"
}
```
*Note: `employee_code` is auto-generated if not provided*

### Update Employee
```http
PUT /api/employees/:id
{
  "first_name": "Jane",
  "is_active": false
}
```

### Delete Employee (Soft Delete)
```http
DELETE /api/employees/:id
```

---

## 🏫 Classes

**Access:** All authenticated (GET), Admin only (POST/PUT/DELETE)

### List Classes
```http
GET /api/classes?page=1&limit=10&teacher_id=2&active_only=true&show_all=false
```

### Get Class
```http
GET /api/classes/:id
```

### Create Class
```http
POST /api/classes
{
  "class_name": "Grade 1 - Section A",
  "class_code": "G1A",
  "grade_level": 1,
  "section": "A",
  "capacity": 30,
  "teacher_id": 2,
  "academic_year": "2024-2025"
}
```

### Update Class
```http
PUT /api/classes/:id
```

### Delete Class (Soft Delete)
```http
DELETE /api/classes/:id
```

---

## 🎓 Students

**Access:** All authenticated (GET), Admin only (POST/PUT/DELETE)

### List Students
```http
GET /api/students?page=1&limit=10&search=john&class_id=1&is_active=true&show_all=false
```

### Get Student
```http
GET /api/students/:id
```

### Create Student
```http
POST /api/students
{
  "student_code": "STU001",
  "first_name": "Alice",
  "last_name": "Smith",
  "email": "alice@example.com",
  "date_of_birth": "2010-05-15",
  "enrollment_date": "2024-09-01",
  "class_id": 1,
  "parent_name": "John Smith",
  "parent_phone": "123-456-7890"
}
```

### Update Student
```http
PUT /api/students/:id
```

### Delete Student (Soft Delete)
```http
DELETE /api/students/:id
```

---

## 🔑 Roles

**Access:** Admin only

### List Roles
```http
GET /api/roles?active_only=true&show_all=false
```

### Get Role
```http
GET /api/roles/:id
```

### Create Role
```http
POST /api/roles
{
  "name": "teacher",
  "description": "Teacher role",
  "permission_ids": [1, 2, 3]
}
```

### Update Role
```http
PUT /api/roles/:id
{
  "name": "teacher",
  "is_active": true,
  "permission_ids": [1, 2, 3, 4]
}
```

### Delete Role (Soft Delete)
```http
DELETE /api/roles/:id
```

---

## 🔐 Permissions

**Access:** Admin only

### List Permissions
```http
GET /api/permissions
```

### Get Grouped Permissions
```http
GET /api/permissions/grouped
```

### Get Permission
```http
GET /api/permissions/:id
```

### Create Permission
```http
POST /api/permissions
{
  "name": "manage_students",
  "resource": "students",
  "action": "manage"
}
```

### Update Permission
```http
PUT /api/permissions/:id
```

### Delete Permission
```http
DELETE /api/permissions/:id
```

---

## 📚 Courses

**Access:** All authenticated (GET), Admin only (POST/PUT/DELETE)

### List Courses
```http
GET /api/courses?active_only=true&show_all=false
```

### Get Course
```http
GET /api/courses/:id
```

### Create Course
```http
POST /api/courses
{
  "name": "Mathematics",
  "code": "MATH101",
  "description": "Basic mathematics course"
}
```

### Update Course
```http
PUT /api/courses/:id
```

### Delete Course (Soft Delete)
```http
DELETE /api/courses/:id
```

---

## 📖 Class-Course Assignments

**Access:** All authenticated (GET), Admin only (POST/PUT/DELETE)

### List Assignments
```http
GET /api/class-courses?class_id=1&course_id=2&teacher_id=3&academic_year=2024-2025
```

### Get Assignment
```http
GET /api/class-courses/:id
```

### Create Assignment
```http
POST /api/class-courses
{
  "class_id": 1,
  "course_id": 2,
  "teacher_id": 3,
  "academic_year": "2024-2025"
}
```

### Update Assignment
```http
PUT /api/class-courses/:id
{
  "teacher_id": 4,
  "academic_year": "2024-2025"
}
```

### Delete Assignment (Soft Delete)
```http
DELETE /api/class-courses/:id
```

---

## 📝 Course Notes (Grades)

**Access:** Teachers (assigned), Admin, Principal

### List Notes
```http
GET /api/course-notes?student_id=1&class_id=1&course_id=2&semester=1&academic_year=2024-2025
```

### Get Student Notes
```http
GET /api/course-notes/student/:studentId?academic_year=2024-2025
```

### Create/Update Note (Upsert)
```http
POST /api/course-notes
{
  "student_id": 1,
  "class_id": 1,
  "course_id": 2,
  "teacher_id": 3,
  "academic_year": "2024-2025",
  "semester": 1,
  "partial1_score": 90,
  "partial1_total": 100,
  "partial2_score": 85,
  "partial2_total": 100,
  "final_score": 88,
  "final_total": 100,
  "semester_total": 263,
  "comment": "Good performance"
}
```

### Update Note by ID
```http
PUT /api/course-notes/:id
{
  "partial1_score": 95,
  "semester_total": 268
}
```

### Delete Note
```http
DELETE /api/course-notes/:id
```

---

## 📋 Common Query Parameters

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search term (for name, email, code fields)
- `is_active` - Filter by active status (`true`/`false`)
- `active_only` - Return only active items (for dropdowns)
- `show_all` - Include deleted items (default: `false`)

---

## ⚠️ Important Notes

### Soft Delete
- All DELETE operations are **soft deletes** (sets `is_active = false` and `deleted_at = NOW()`)
- **Deleted records cannot be updated or reactivated** (returns 403 Forbidden)
- Use `show_all=true` to see deleted records in lists
- Use `active_only=true` for dropdowns/selection lists

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### Error Format
```json
{
  "success": false,
  "error": "Error message"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions or deleted record)
- `404` - Not Found
- `500` - Server Error

---

## 🔒 Authorization Roles

- **admin** - Full access to all endpoints
- **principal** - Read access + some write access
- **teacher** - Limited access (own courses/notes)

---

## 📌 Special Behaviors

1. **Employee Code**: Auto-generated as `EMP001`, `EMP002`, etc. if not provided
2. **Course Notes**: Semester must be 1, 2, or 3
3. **Class-Course Assignment**: Unique per `(class_id, course_id, academic_year)`
4. **Deleted Records**: Cannot be updated (403 error)
