import type { GetClassCoursesParams } from "@/lib/api/classCourses";
import type { GetClassesParams } from "@/lib/api/classes";
import type { GetCourseNotesParams } from "@/lib/api/courseNotes";
import type { GetCoursesParams } from "@/lib/api/courses";
import type { GetEmployeesParams } from "@/lib/api/employees";
import type { GetStudentsParams } from "@/lib/api/students";

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  classes: {
    all: ["classes"] as const,
    list: (params?: GetClassesParams) => ["classes", "list", params ?? {}] as const,
    detail: (id: number) => ["classes", "detail", id] as const,
  },
  courses: {
    all: ["courses"] as const,
    list: (params?: GetCoursesParams) => ["courses", "list", params ?? {}] as const,
    detail: (id: number) => ["courses", "detail", id] as const,
  },
  roles: {
    all: ["roles"] as const,
    list: (activeOnly?: boolean, showAll?: boolean) =>
      ["roles", "list", { activeOnly: !!activeOnly, showAll }] as const,
    detail: (id: number) => ["roles", "detail", id] as const,
  },
  permissions: {
    all: ["permissions"] as const,
    list: (params?: { resource?: string; action?: string }) =>
      ["permissions", "list", params ?? {}] as const,
    grouped: ["permissions", "grouped"] as const,
    detail: (id: number) => ["permissions", "detail", id] as const,
  },
  employees: {
    all: ["employees"] as const,
    list: (params?: GetEmployeesParams) => ["employees", "list", params ?? {}] as const,
    detail: (id: number) => ["employees", "detail", id] as const,
  },
  students: {
    all: ["students"] as const,
    list: (params?: GetStudentsParams) => ["students", "list", params ?? {}] as const,
    detail: (id: number) => ["students", "detail", id] as const,
    nextCode: ["students", "next-code"] as const,
  },
  classCourses: {
    all: ["class-courses"] as const,
    list: (params?: GetClassCoursesParams) =>
      ["class-courses", "list", params ?? {}] as const,
    detail: (id: number) => ["class-courses", "detail", id] as const,
  },
  courseNotes: {
    all: ["course-notes"] as const,
    list: (params?: GetCourseNotesParams) => ["course-notes", "list", params ?? {}] as const,
    my: (academicYear?: string) => ["course-notes", "my", academicYear ?? ""] as const,
    byStudent: (studentId: number) => ["course-notes", "student", studentId] as const,
  },
};
