"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canAccessRoute } from "@/lib/permissions/utils";

type Props = { children: React.ReactNode };

/**
 * Blocks dashboard URLs the user is not allowed to see (permissions + account type).
 */
export default function DashboardRouteGuard({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, isReady } = useAuth();

  useEffect(() => {
    if (!isReady || !session) return;

    const { allowed, redirectTo } = canAccessRoute(
      pathname,
      session.accountType,
      session.permissions
    );

    if (!allowed && redirectTo && redirectTo !== pathname) {
      router.replace(redirectTo);
    }
  }, [pathname, session, isReady, router]);

  if (!isReady) return null;

  if (session) {
    const { allowed } = canAccessRoute(
      pathname,
      session.accountType,
      session.permissions
    );
    if (!allowed) return null;
  }

  return <>{children}</>;
}
