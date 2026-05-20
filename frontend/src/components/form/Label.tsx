import React, { FC, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface LabelProps {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

const Label: FC<LabelProps> = ({ htmlFor, children, className }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={twMerge(
        // Default classes that apply by default
        "mb-1.5 block text-sm font-medium",

        // User-defined className that can override the default margin
        className
      )}
      style={{ color: "var(--theme-text-secondary)" }}
    >
      {children}
    </label>
  );
};

export default Label;
