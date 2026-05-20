"use client";

import React from "react";
import SignInForm from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundColor: "var(--theme-background-secondary)",
      }}
    >
      <div
        className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-theme-xl border"
        style={{
          backgroundColor: "var(--theme-surface)",
          borderColor: "var(--theme-border)",
        }}
      >
        <div className="flex flex-col lg:flex-row">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}