"use client";
import { useSidebar } from "@/context/SidebarContext";
import React from "react";

const Backdrop: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 lg:hidden"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={toggleMobileSidebar}
    />
  );
};

export default Backdrop;
