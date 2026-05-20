import { ROUTE_ACCESS_RULES, type AccountType } from "./config";

export function hasAnyPermission(
  userPermissions: string[] | Set<string> | undefined,
  codes: string[]
): boolean {
  if (!codes.length) return true;
  if (!userPermissions) return false;
  const set = userPermissions instanceof Set ? userPermissions : new Set(userPermissions);
  return codes.some((code) => set.has(code));
}

export function hasAllPermissions(
  userPermissions: string[] | Set<string> | undefined,
  codes: string[]
): boolean {
  if (!codes.length) return true;
  if (!userPermissions) return false;
  const set = userPermissions instanceof Set ? userPermissions : new Set(userPermissions);
  return codes.every((code) => set.has(code));
}

export function canAccessRoute(
  pathname: string,
  accountType: AccountType | null,
  permissions: string[]
): { allowed: boolean; redirectTo?: string } {
  if (!accountType) {
    return { allowed: false, redirectTo: "/auth/signin" };
  }

  const rule = [...ROUTE_ACCESS_RULES]
    .sort((a, b) => b.pathPrefix.length - a.pathPrefix.length)
    .find((r) => pathname === r.pathPrefix || pathname.startsWith(`${r.pathPrefix}/`));

  if (!rule) {
    return accountType === "student"
      ? { allowed: false, redirectTo: "/dashboard/my-grades" }
      : { allowed: false, redirectTo: "/dashboard" };
  }

  if (rule.accountTypes && !rule.accountTypes.includes(accountType)) {
    return accountType === "student"
      ? { allowed: false, redirectTo: "/dashboard/my-grades" }
      : { allowed: false, redirectTo: "/dashboard" };
  }

  if (rule.permissions?.length && accountType === "employee") {
    if (!hasAnyPermission(permissions, rule.permissions)) {
      return { allowed: false, redirectTo: "/dashboard" };
    }
  }

  return { allowed: true };
}

export function canSeeNavItem(
  item: { accountTypes?: AccountType[]; permissions?: string[] },
  accountType: AccountType | null,
  permissions: string[]
): boolean {
  if (!accountType) return false;
  if (item.accountTypes && !item.accountTypes.includes(accountType)) return false;
  if (item.permissions?.length && accountType === "employee") {
    return hasAnyPermission(permissions, item.permissions);
  }
  return true;
}
