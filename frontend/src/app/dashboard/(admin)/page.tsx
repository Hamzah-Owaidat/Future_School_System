import React from "react";

export default function AdminHome() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-md dark:border-gray-800 dark:bg-gray-dark"
        style={{ color: "var(--theme-text-primary)" }}
      >
        <h1 className="text-2xl font-semibold mb-1">
          Welcome to Future School System
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Use the sidebar to manage employees, students, classes, roles, and
          permissions.
        </p>
      </div>
    </div>
  );
}
