"use client";

import React from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
}) => {
  const handleToggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={`relative inline-flex items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-90"
      } h-5 w-9`}
      style={{
        backgroundColor: checked 
          ? "#12b76a" // Green when active
          : "#d0d5dd", // Gray when inactive
        border: "none",
      }}
      aria-label={checked ? "Active" : "Inactive"}
      aria-pressed={checked}
    >
      <span
        className={`inline-block rounded-full bg-white transform transition-all duration-200 ease-in-out ${
          checked ? "translate-x-4" : "translate-x-0.5"
        } h-4 w-4`}
        style={{
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.1)",
        }}
      />
    </button>
  );
};

