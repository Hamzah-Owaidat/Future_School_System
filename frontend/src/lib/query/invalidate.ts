import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

/** Invalidate cached lists after mutations */
export const cacheInvalidation = {
  classes: (qc: QueryClient) =>
    qc.invalidateQueries({ queryKey: queryKeys.classes.all }),

  courses: (qc: QueryClient) =>
    qc.invalidateQueries({ queryKey: queryKeys.courses.all }),

  roles: (qc: QueryClient) =>
    qc.invalidateQueries({ queryKey: queryKeys.roles.all }),

  permissions: (qc: QueryClient) => {
    void qc.invalidateQueries({ queryKey: queryKeys.permissions.all });
    void qc.invalidateQueries({ queryKey: queryKeys.permissions.grouped });
  },

  employees: (qc: QueryClient) =>
    qc.invalidateQueries({ queryKey: queryKeys.employees.all }),

  students: (qc: QueryClient) => {
    void qc.invalidateQueries({ queryKey: queryKeys.students.all });
    void qc.invalidateQueries({ queryKey: queryKeys.students.nextCode });
  },

  classCourses: (qc: QueryClient) =>
    qc.invalidateQueries({ queryKey: queryKeys.classCourses.all }),

  courseNotes: (qc: QueryClient) =>
    qc.invalidateQueries({ queryKey: queryKeys.courseNotes.all }),

  referenceData: (qc: QueryClient) => {
    cacheInvalidation.classes(qc);
    cacheInvalidation.courses(qc);
    cacheInvalidation.roles(qc);
    cacheInvalidation.permissions(qc);
    cacheInvalidation.employees(qc);
  },
};
