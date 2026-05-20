"use client";

import React from "react";
import { usePermissions } from "@/hooks/usePermissions";

type PermissionGateProps = {
  /** User needs at least one */
  permissions?: string[];
  /** Restrict to account type */
  accountTypes?: ("employee" | "student")[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Renders children only when the current user has the required permission(s).
 */
export default function PermissionGate({
  permissions = [],
  accountTypes,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { canAny, accountType, isStudent, isEmployee } = usePermissions();

  if (accountTypes?.length) {
    if (accountType && !accountTypes.includes(accountType)) {
      return <>{fallback}</>;
    }
  }

  if (isStudent && accountTypes && !accountTypes.includes("student")) {
    return <>{fallback}</>;
  }

  if (isEmployee && permissions.length > 0 && !canAny(permissions)) {
    return <>{fallback}</>;
  }

  if (isStudent && permissions.length > 0) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
