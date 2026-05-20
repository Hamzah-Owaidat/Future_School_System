# FuturSchool System

A full-stack school management application for staff and students: employees, classes, courses, role-based access control (RBAC), class–teacher assignments, and course notes (grades).

| Layer | Stack |
|-------|--------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, TanStack Query |
| **Backend** | Node.js, Express 4, MySQL |
| **Auth** | JWT, bcrypt, permission-based API guards |

---

## Repository structure

```
FutureSchoolSystem/
├── backend/          # REST API, migrations, seed data
│   ├── controllers/
│   ├── database/     # migrations/, schema.sql, seed_data.sql
│   ├── middleware/   # auth, RBAC, errors
│   ├── routes/
│   └── scripts/      # migrate.js, run-seed.js
├── frontend/         # Next.js dashboard UI
│   └── src/
│       ├── app/      # pages (dashboard, auth)
│       ├── components/
│       ├── context/  # auth session
│       └── lib/      # API clients, permissions, React Query cache
└── README.md         # this file
```

---

## Features

- **Staff portal** — manage employees, students, classes, courses, and class–course–teacher assignments
- **RBAC** — roles and permissions; API enforced with `requirePermission(...)`; UI gated by permission codes
- **Grades** — course notes per student, class, course, academic year, and semester
- **Student portal** — students with login can view their own grades (`/dashboard/my-grades`)
- **Auto codes** — employee codes (`EMP001`, …) and student codes (`STU000`, `STU001`, …) generated on create
- **Migrations** — SQL migration runner (idempotent alters, fresh/rollback for dev)
- **Client caching** — TanStack Query caches list/detail API data; devtools available in development

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **MySQL** 8.x (or MariaDB compatible with MySQL client)
- **npm** (comes with Node)

---

## Quick start

### 1. Database

Create a MySQL database (default name: `futurschool`):

```sql
CREATE DATABASE futurschool CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
npm install
```

Copy the example env file and edit your values:

```bash
cp .env.example .env
```

See [backend/.env.example](backend/.env.example) for every variable and its description.

Apply schema and seed demo data:

```bash
npm run db:refresh
```

Start the API:

```bash
npm run dev
```

Health check: [http://localhost:8080/health](http://localhost:8080/health)  
API root: [http://localhost:8080/api](http://localhost:8080/api)

### 3. Frontend

```bash
cd frontend
npm install
```

Copy the example env file and set the API URL (must match backend `PORT`):

```bash
cp .env.local.example .env.local
```

See [frontend/.env.local.example](frontend/.env.local.example) for details.

Start the UI:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

> **Port note:** Next.js uses port **3000** by default. The API URL in `.env.local` must match `PORT` in `backend/.env` (example above uses **8080**).

---

## Default accounts (after seed)

| Email | Password | Access |
|-------|----------|--------|
| `admin@futurschool.com` | `password1234` | Full admin (all permissions) |
| `john.doe@student.futurschool.com` | `password1234` | Student — own grades only |

Change these passwords before any production deployment.

---

## npm scripts

### Backend (`backend/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | API with nodemon |
| `npm start` | API (production) |
| `npm run migrate` | Run pending migrations |
| `npm run migrate:status` | List applied / pending migrations |
| `npm run migrate:fresh` | Drop DB, rerun all migrations |
| `npm run migrate:rollback` | Roll back last migration batch |
| `npm run db:seed` | Run `database/seed_data.sql` |
| `npm run db:refresh` | Fresh migrate + seed (dev only) |

### Frontend (`frontend/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |

---

## API overview

Base path: `/api` (see [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md) for details).

| Area | Prefix | Notes |
|------|--------|--------|
| Auth | `/api/auth` | Login, `/auth/me` |
| Employees | `/api/employees` | Staff CRUD |
| Students | `/api/students` | CRUD; `GET /students/next-code` for preview |
| Classes | `/api/classes` | Class CRUD |
| Courses | `/api/courses` | Course catalog |
| Class courses | `/api/class-courses` | Teacher ↔ class ↔ course assignments |
| Course notes | `/api/course-notes` | Grades; `GET /course-notes/me` for students |
| Roles | `/api/roles` | Role + permission mapping |
| Permissions | `/api/permissions` | Permission catalogue |

Protected routes require `Authorization: Bearer <token>` from login.

### Permission examples (seed)

- `employee.read` / `employee.manage`
- `student.read` / `student.manage`
- `class.read` / `class.manage`
- `course.read` / `course.manage`
- `course_note.read` / `course_note.write` / `course_note.manage`
- `role.manage`, `permission.manage`

---

## Frontend architecture (high level)

- **Auth** — `AuthContext` stores session + permissions in `localStorage`; dashboard layout refreshes via `/auth/me`
- **Route guard** — `DashboardRouteGuard` blocks URLs the user cannot access
- **Sidebar** — items filtered by permission codes (`lib/permissions/config.ts`)
- **Pages** — CRUD tables with `useResourceAccess` / `PermissionGate` for actions
- **Caching** — TanStack Query (`lib/query/`); inspect cache in dev with the **React Query** panel (bottom-left)

Stale times are configured in `frontend/src/lib/query/cacheTimes.ts`.

---

## Database

- Migrations: `backend/database/migrations/`
- Reference DDL: `backend/database/schema.sql`
- Seed: `backend/database/seed_data.sql`
- Docs: [backend/database/README.md](backend/database/README.md)

Core tables: `users`, `employees`, `students`, `roles`, `permissions`, `role_permissions`, `user_roles`, `classes`, `courses`, `class_courses`, `course_notes`.

---

## Development tips

1. After `db:refresh`, **sign out and sign in** so the UI loads fresh permissions.
2. If migrations fail on an old database, use `npm run db:refresh` in `backend/` (destroys data).
3. Student **portal login** needs both **email** and **password** on create; contact email alone does not create a login.
4. **Student codes** are auto-assigned (`STU000`, …); do not rely on manual codes unless you pass them explicitly to the API.

---

## Security notes (production)

- Set a strong `JWT_SECRET` in `backend/.env`
- Use HTTPS and restrict CORS to your frontend origin
- Replace default seed passwords
- Do not run `db:refresh` or `migrate:fresh` on production data

---

## Environment files

| File | Copy to | Purpose |
|------|---------|---------|
| [backend/.env.example](backend/.env.example) | `backend/.env` | Server, MySQL, JWT |
| [frontend/.env.local.example](frontend/.env.local.example) | `frontend/.env.local` | API base URL |

## Further documentation

| Document | Content |
|----------|---------|
| [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md) | REST endpoints |
| [backend/database/README.md](backend/database/README.md) | Migrations & schema |
| [frontend/src/lib/api/README.md](frontend/src/lib/api/README.md) | Frontend API layer |

---

## License

ISC (backend). Frontend is private (`"private": true` in package.json).
