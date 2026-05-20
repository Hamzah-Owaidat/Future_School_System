"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/axios";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Basic client-side check for token
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (!token) {
          router.replace("/auth/signin");
          return;
        }

        // Optionally validate token and refresh user via /auth/me
        try {
          const response = await api.get("/auth/me");
          const payload: any = response.data;
          const data = payload?.data ?? payload;

          if (typeof window !== "undefined" && data?.employee) {
            localStorage.setItem("user", JSON.stringify(data.employee));
          }
        } catch (err) {
          // If /auth/me fails, clear auth and redirect to signin
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
          router.replace("/auth/signin");
          return;
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    void checkAuth();
  }, [router]);

  // While checking auth, show a minimal loading state
  if (isCheckingAuth) {
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

  // Dynamic class for main content margin based on sidebar state
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
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out overflow-x-hidden ${mainContentMargin}`}
        style={{ backgroundColor: "var(--theme-background-secondary)" }}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <main className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
