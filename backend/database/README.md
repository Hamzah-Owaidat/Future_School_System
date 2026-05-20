# FuturSchool database

Schema is applied via **`database/migrations/`** and `npm run migrate` (see `lib/migrateRunner.js`).

## Quick start

From **`backend/`**:

```bash
npm run migrate           # Pending migrations only
npm run migrate:status    # Applied vs pending
npm run db:seed           # Demo roles, admin, sample student
npm run db:refresh        # DROP DB → migrate → seed (dev only)
npm run migrate:fresh     # DROP DB → migrate all
```

## Tables (active)

| Table | Role |
|-------|------|
| `users` | Login (email, `password_hash`, `user_type`) |
| `employees` | Staff profiles → `users` |
| `students` | Pupil profiles → optional `users` for portal |
| `roles`, `permissions`, `role_permissions`, `user_roles` | RBAC |
| `classes`, `courses`, `class_courses` | Structure & assignments |
| `course_notes` | Grades / semester notes per student |

Removed (unused): `user_permissions`, `student_enrollments` — see migration `20260220000002_drop_unused_tables.sql`.

## API auth (aligned with schema)

- **Staff:** `POST /api/auth/login` → JWT with `userId`, `type: 'employee'`, `profileId` (employee id). Permissions loaded from `user_roles` → `role_permissions`.
- **Students:** login with student `users` row → `type: 'student'`. View own notes: `GET /api/course-notes/me`.
- Routes use **`requirePermission('code')`** (not only role names). Codes are seeded in `seed_data.sql`.

## Default accounts (after seed)

| Email | Password | Type |
|-------|----------|------|
| admin@futurschool.com | password1234 | Admin (all permissions) |
| john.doe@student.futurschool.com | password1234 | Student (own notes only) |

## Troubleshooting

If seed fails with **Unknown column**, the DB may still have an old layout. Run:

```bash
npm run db:refresh
```
