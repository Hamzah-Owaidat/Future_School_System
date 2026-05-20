import React from "react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--theme-background-secondary)" }}>
      <div className="max-w-2xl mx-auto text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark">
          <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--theme-text-primary)" }}>
            Welcome to Future School System
          </h1>
          <p className="text-lg mb-6" style={{ color: "var(--theme-text-secondary)" }}>
            Student Portal
          </p>
          <p className="text-sm mb-8" style={{ color: "var(--theme-text-tertiary)" }}>
            This is the student portal homepage. Student features will be available here in the future.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button variant="primary" size="md">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="md">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

