/**
 * Permission codes must match backend seed (resource.action).
 */

export type AccountType = "employee" | "student";

export type PermissionResource =
  | "employee"
  | "student"
  | "class"
  | "course"
  | "course_note"
  | "role"
  | "permission";

export type NavItemConfig = {
  name: string;
  path: string;
  iconKey: "grid" | "group" | "user" | "folder" | "task" | "lock";
  /** Staff-only, student-only, or any authenticated user */
  accountTypes?: AccountType[];
  /** User needs at least one of these (staff). Empty = any authenticated account type allowed */
  permissions?: string[];
  section?: "main" | "security";
};

/** Sidebar + route guard */
export const NAV_ITEMS: NavItemConfig[] = [
  { name: "Dashboard", path: "/dashboard", iconKey: "grid", section: "main" },
  {
    name: "Employees",
    path: "/dashboard/employees",
    iconKey: "group",
    accountTypes: ["employee"],
    permissions: ["employee.read", "employee.manage"],
    section: "main",
  },
  {
    name: "Students",
    path: "/dashboard/students",
    iconKey: "user",
    accountTypes: ["employee"],
    permissions: ["student.read", "student.manage"],
    section: "main",
  },
  {
    name: "Courses",
    path: "/dashboard/courses",
    iconKey: "folder",
    accountTypes: ["employee"],
    permissions: ["course.read", "course.manage"],
    section: "main",
  },
  {
    name: "Classes",
    path: "/dashboard/classes",
    iconKey: "folder",
    accountTypes: ["employee"],
    permissions: ["class.read", "class.manage"],
    section: "main",
  },
  {
    name: "Assignments",
    path: "/dashboard/class-courses",
    iconKey: "task",
    accountTypes: ["employee"],
    permissions: ["course.read", "course.manage", "class.read", "class.manage"],
    section: "main",
  },
  {
    name: "Grades",
    path: "/dashboard/grades",
    iconKey: "task",
    accountTypes: ["employee"],
    permissions: ["course_note.read", "course_note.write", "course_note.manage"],
    section: "main",
  },
  {
    name: "My Grades",
    path: "/dashboard/my-grades",
    iconKey: "task",
    accountTypes: ["student"],
    section: "main",
  },
  {
    name: "Roles",
    path: "/dashboard/roles",
    iconKey: "task",
    accountTypes: ["employee"],
    permissions: ["role.manage"],
    section: "security",
  },
  {
    name: "Permissions",
    path: "/dashboard/permissions",
    iconKey: "lock",
    accountTypes: ["employee"],
    permissions: ["permission.manage"],
    section: "security",
  },
];

/** Longest paths first so /dashboard/students/1/grades matches students rules correctly */
export const ROUTE_ACCESS_RULES: { pathPrefix: string; permissions?: string[]; accountTypes?: AccountType[] }[] = [
  { pathPrefix: "/dashboard/my-grades", accountTypes: ["student"] },
  { pathPrefix: "/dashboard/employees", accountTypes: ["employee"], permissions: ["employee.read", "employee.manage"] },
  { pathPrefix: "/dashboard/students", accountTypes: ["employee"], permissions: ["student.read", "student.manage"] },
  { pathPrefix: "/dashboard/courses", accountTypes: ["employee"], permissions: ["course.read", "course.manage"] },
  { pathPrefix: "/dashboard/classes", accountTypes: ["employee"], permissions: ["class.read", "class.manage"] },
  { pathPrefix: "/dashboard/class-courses", accountTypes: ["employee"], permissions: ["course.read", "course.manage", "class.read", "class.manage"] },
  { pathPrefix: "/dashboard/grades", accountTypes: ["employee"], permissions: ["course_note.read", "course_note.write", "course_note.manage"] },
  { pathPrefix: "/dashboard/roles", accountTypes: ["employee"], permissions: ["role.manage"] },
  { pathPrefix: "/dashboard/permissions", accountTypes: ["employee"], permissions: ["permission.manage"] },
  { pathPrefix: "/dashboard", accountTypes: ["employee", "student"] },
];

export function readPermissions(resource: PermissionResource): string[] {
  return [`${resource}.read`, `${resource}.manage`];
}

export function managePermission(resource: PermissionResource): string {
  return `${resource}.manage`;
}

export function courseNoteViewPermissions(): string[] {
  return ["course_note.read", "course_note.write", "course_note.manage"];
}

export function courseNoteWritePermissions(): string[] {
  return ["course_note.write", "course_note.manage"];
}
