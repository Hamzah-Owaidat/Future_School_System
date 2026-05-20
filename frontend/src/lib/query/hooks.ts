"use client";

import {
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { api } from "@/lib/api/axios";
import { classesApi, type Class, type GetClassesParams } from "@/lib/api/classes";
import { coursesApi, type Course, type GetCoursesParams } from "@/lib/api/courses";
import { rolesApi, type Role } from "@/lib/api/roles";
import {
  permissionsApi,
  type GroupedPermissions,
  type Permission,
} from "@/lib/api/permissions";
import { employeeApi, type Employee, type GetEmployeesParams } from "@/lib/api/employees";
import { studentsApi, type GetStudentsParams, type Student } from "@/lib/api/students";
import {
  classCoursesApi,
  type ClassCourse,
  type GetClassCoursesParams,
} from "@/lib/api/classCourses";
import {
  courseNotesApi,
  type CourseNote,
  type GetCourseNotesParams,
} from "@/lib/api/courseNotes";
import {
  buildSessionFromMePayload,
  type AuthSession,
} from "@/context/AuthContext";
import { STALE } from "./cacheTimes";
import { cacheInvalidation } from "./invalidate";
import { queryKeys } from "./queryKeys";

export { cacheInvalidation };

export function useInvalidateCache() {
  const qc = useQueryClient();
  return {
    classes: () => cacheInvalidation.classes(qc),
    courses: () => cacheInvalidation.courses(qc),
    roles: () => cacheInvalidation.roles(qc),
    permissions: () => cacheInvalidation.permissions(qc),
    employees: () => cacheInvalidation.employees(qc),
    students: () => cacheInvalidation.students(qc),
    classCourses: () => cacheInvalidation.classCourses(qc),
    courseNotes: () => cacheInvalidation.courseNotes(qc),
    referenceData: () => cacheInvalidation.referenceData(qc),
  };
}

/** Cached /auth/me — refreshes session in AuthContext via layout */
export function useAuthMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async (): Promise<AuthSession | null> => {
      const response = await api.get("/auth/me");
      const payload = response.data as unknown as Record<string, unknown>;
      const data = (payload?.data ?? payload) as Record<string, unknown>;
      return buildSessionFromMePayload({
        account_type: data.account_type as string | undefined,
        employee: data.employee as never,
        student: data.student as never,
        permissions: (data.permissions as string[]) ?? [],
      });
    },
    enabled: enabled && typeof window !== "undefined" && !!localStorage.getItem("token"),
    staleTime: STALE.AUTH,
  });
}

export function useClassesList(
  params: GetClassesParams = { show_all: false },
  options?: Partial<UseQueryOptions<Class[]>>
) {
  return useQuery({
    queryKey: queryKeys.classes.list(params),
    queryFn: () => classesApi.getAll(params),
    staleTime: STALE.CLASSES,
    ...options,
  });
}

export function useClassDetail(id: number | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.classes.detail(id ?? 0),
    queryFn: () => classesApi.getById(id!),
    enabled: enabled && id != null && id > 0,
    staleTime: STALE.DETAIL,
  });
}

export function useCoursesList(
  params: GetCoursesParams = { show_all: false },
  options?: Partial<UseQueryOptions<Course[]>>
) {
  return useQuery({
    queryKey: queryKeys.courses.list(params),
    queryFn: () => coursesApi.getAll(params),
    staleTime: STALE.COURSES,
    ...options,
  });
}

export function useRolesList(activeOnly?: boolean, showAll?: boolean) {
  return useQuery({
    queryKey: queryKeys.roles.list(activeOnly, showAll),
    queryFn: () => rolesApi.getAll(activeOnly, showAll),
    staleTime: STALE.ROLES,
  });
}

export function useRoleDetail(id: number | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.roles.detail(id ?? 0),
    queryFn: () => rolesApi.getById(id!),
    enabled: enabled && id != null && id > 0,
    staleTime: STALE.DETAIL,
  });
}

export function usePermissionsList(params?: { resource?: string; action?: string }) {
  return useQuery({
    queryKey: queryKeys.permissions.list(params),
    queryFn: () => permissionsApi.getAll(params),
    staleTime: STALE.PERMISSIONS,
  });
}

export function useGroupedPermissions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.permissions.grouped,
    queryFn: () => permissionsApi.getGrouped(),
    enabled,
    staleTime: STALE.PERMISSIONS,
  });
}

export function usePermissionDetail(id: number | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.permissions.detail(id ?? 0),
    queryFn: () => permissionsApi.getById(id!),
    enabled: enabled && id != null && id > 0,
    staleTime: STALE.DETAIL,
  });
}

export function useEmployeesList(
  params: GetEmployeesParams = { show_all: false },
  options?: Partial<UseQueryOptions<Employee[]>>
) {
  return useQuery({
    queryKey: queryKeys.employees.list(params),
    queryFn: () => employeeApi.getAll(params),
    staleTime: STALE.EMPLOYEES,
    ...options,
  });
}

/** Teachers only — derived from cached full employee list */
export function useTeacherEmployees() {
  return useQuery({
    queryKey: [...queryKeys.employees.list({ show_all: false }), "teachers"] as const,
    queryFn: async () => {
      const all = await employeeApi.getAll({ show_all: false });
      return all.filter(
        (emp) => emp.role_name?.toLowerCase() === "teacher"
      );
    },
    staleTime: STALE.EMPLOYEES,
  });
}

export function useEmployeeDetail(id: number | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id ?? 0),
    queryFn: () => employeeApi.getById(id!),
    enabled: enabled && id != null && id > 0,
    staleTime: STALE.DETAIL,
  });
}

export function useStudentsList(
  params: GetStudentsParams = { show_all: false },
  options?: Partial<UseQueryOptions<Student[]>>
) {
  return useQuery({
    queryKey: queryKeys.students.list(params),
    queryFn: () => studentsApi.getAll(params),
    staleTime: STALE.STUDENTS,
    ...options,
  });
}

export function useStudentDetail(id: number | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.students.detail(id ?? 0),
    queryFn: () => studentsApi.getById(id!),
    enabled: enabled && id != null && id > 0,
    staleTime: STALE.DETAIL,
  });
}

export function useNextStudentCode(enabled = true) {
  return useQuery({
    queryKey: queryKeys.students.nextCode,
    queryFn: () => studentsApi.getNextCode(),
    enabled,
    staleTime: STALE.NEXT_CODE,
    gcTime: STALE.NEXT_CODE,
  });
}

export function useClassCoursesList(
  params?: GetClassCoursesParams,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.classCourses.list(params),
    queryFn: () => classCoursesApi.getAll(params),
    enabled,
    staleTime: STALE.ASSIGNMENTS,
  });
}

export function useCourseNotesList(
  params?: GetCourseNotesParams,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.courseNotes.list(params),
    queryFn: () => courseNotesApi.getAll(params),
    enabled,
    staleTime: STALE.GRADES,
  });
}

export function useMyCourseNotes(academicYear?: string) {
  return useQuery({
    queryKey: queryKeys.courseNotes.my(academicYear),
    queryFn: () => courseNotesApi.getMy(academicYear),
    staleTime: STALE.MY_GRADES,
  });
}

export function useStudentCourseNotes(
  studentId: number | null,
  academicYear?: string,
  enabled = true
) {
  return useQuery({
    queryKey: [...queryKeys.courseNotes.byStudent(studentId ?? 0), academicYear ?? ""] as const,
    queryFn: () => courseNotesApi.getByStudent(studentId!, academicYear),
    enabled: enabled && studentId != null && studentId > 0,
    staleTime: STALE.GRADES,
  });
}
