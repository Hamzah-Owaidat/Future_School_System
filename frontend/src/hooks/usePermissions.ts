"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  type AccountType,
  type PermissionResource,
  readPermissions,
  managePermission,
  courseNoteViewPermissions,
  courseNoteWritePermissions,
} from "@/lib/permissions";
import { hasAnyPermission } from "@/lib/permissions/utils";

export function usePermissions() {
  const { session } = useAuth();

  const permissions = session?.permissions ?? [];
  const accountType = session?.accountType ?? null;
  const employeeId = session?.employee?.id ?? null;

  return useMemo(
    () => ({
      session,
      accountType,
      permissions,
      employeeId,
      isEmployee: accountType === "employee",
      isStudent: accountType === "student",
      can: (code: string) => hasAnyPermission(permissions, [code]),
      canAny: (codes: string[]) => hasAnyPermission(permissions, codes),
      canAll: (codes: string[]) => {
        const set = new Set(permissions);
        return codes.every((c) => set.has(c));
      },
    }),
    [session, accountType, permissions, employeeId]
  );
}

/** CRUD helpers for a resource (employee, student, class, …) */
export function useResourceAccess(resource: PermissionResource) {
  const { can, canAny, accountType } = usePermissions();

  return useMemo(
    () => ({
      canRead: canAny(readPermissions(resource)),
      canCreate: can(managePermission(resource)),
      canUpdate: can(managePermission(resource)),
      canDelete: can(managePermission(resource)),
      canManage: can(managePermission(resource)),
      isStaff: accountType === "employee",
    }),
    [can, canAny, accountType, resource]
  );
}

export function useCourseNoteAccess() {
  const { can, canAny, accountType, employeeId } = usePermissions();

  return useMemo(() => {
    const canManageAll = can("course_note.manage");
    const canWrite = canAny(courseNoteWritePermissions());
    return {
      canView:
        accountType === "student" || canAny(courseNoteViewPermissions()),
      canManageAll,
      canWrite,
      canDelete: canManageAll,
      /** Teacher: write notes only for assigned classes, not full manage */
      isScopedWriter: canWrite && !canManageAll,
      employeeId,
      isStudent: accountType === "student",
    };
  }, [can, canAny, accountType, employeeId]);
}
