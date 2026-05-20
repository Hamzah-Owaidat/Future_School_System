"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import DashboardRouteGuard from "@/components/auth/DashboardRouteGuard";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/axios";
import {
  useAuth,
  buildSessionFromMePayload,
} from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const router = useRouter();
  const { setSession, isReady } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (!token) {
          router.replace("/auth/signin");
          return;
        }

        try {
          const response = await api.get("/auth/me");
          const payload: Record<string, unknown> = response.data as Record<string, unknown>;
          const data = (payload?.data ?? payload) as Record<string, unknown>;

          const session = buildSessionFromMePayload({
            account_type: data.account_type as string | undefined,
            employee: data.employee as never,
            student: data.student as never,
            permissions: (data.permissions as string[]) ?? [],
          });

          if (session) {
            setSession(session);
          }
        } catch {
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("auth_session");
            localStorage.removeItem("user");
            localStorage.removeItem("permissions");
          }
          router.replace("/auth/signin");
          return;
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    void checkAuth();
  }, [router, setSession]);

  if (isCheckingAuth || !isReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--theme-background-secondary)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-[rgba(26,123,155,0.25)] border-t-[#1a7b9b] animate-spin" />
          <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div
      className="min-h-screen xl:flex overflow-x-hidden"
      style={{ backgroundColor: "var(--theme-background-secondary)" }}
    >
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out overflow-x-hidden ${mainContentMargin}`}
        style={{ backgroundColor: "var(--theme-background-secondary)" }}
      >
        <AppHeader />
        <main className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6 w-full overflow-x-hidden">
          <DashboardRouteGuard>{children}</DashboardRouteGuard>
        </main>
      </div>
    </div>
  );
}
