/** Stale times (ms) — data considered fresh; no refetch until expired */
export const STALE = {
  AUTH: 5 * 60 * 1000,
  CLASSES: 10 * 60 * 1000,
  COURSES: 10 * 60 * 1000,
  ROLES: 15 * 60 * 1000,
  PERMISSIONS: 30 * 60 * 1000,
  EMPLOYEES: 5 * 60 * 1000,
  STUDENTS: 2 * 60 * 1000,
  ASSIGNMENTS: 5 * 60 * 1000,
  GRADES: 2 * 60 * 1000,
  DETAIL: 5 * 60 * 1000,
  NEXT_CODE: 60 * 1000,
  MY_GRADES: 2 * 60 * 1000,
} as const;

export const GC = 30 * 60 * 1000;
