"use client";

import React, { useState, useRef, useEffect } from "react";
import { EyeIcon, PencilIcon, TrashBinIcon, CopyIcon } from "@/icons/index";
import { MoreDotIcon } from "@/icons/index";

export interface CustomActionItem<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface ActionsDropdownProps<T> {
  row: T;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onCopyId?: (row: T) => void;
  customActions?: CustomActionItem<T>[];
}

function ActionsDropdown<T>({
  row,
  onView,
  onEdit,
  onDelete,
  onCopyId,
  customActions = [],
}: ActionsDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const updatePosition = () => {
        if (!buttonRef.current || !dropdownRef.current) return;

        const buttonRect = buttonRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const dropdownRect = dropdownRef.current.getBoundingClientRect();
        const dropdownWidth = dropdownRect.width || 200;
        const dropdownHeight = dropdownRect.height || 240;

        // Default position: aligned with button vertically, to the left side (like a context menu)
        let left = buttonRect.right + 8;
        let top = buttonRect.top;

        // Adjust if dropdown would go off-screen to the right
        if (left + dropdownWidth > viewportWidth - 8) {
          left = buttonRect.left - dropdownWidth - 8;
        }

        // If still off-screen to the left, clamp to viewport
        if (left < 8) {
          left = Math.max(8, viewportWidth - dropdownWidth - 8);
        }

        // Preferred: open below the button
        top = buttonRect.bottom + 8;

        // If dropdown would go off-screen to the bottom, open above the button instead
        if (top + dropdownHeight > viewportHeight - 8) {
          top = buttonRect.top - dropdownHeight - 8;
        }

        // If still off-screen (very small viewport), clamp to top
        if (top < 8) {
          top = 8;
        }

        dropdownRef.current.style.left = `${left}px`;
        dropdownRef.current.style.top = `${top}px`;
      };

      // Update position after a brief delay to ensure dropdown is rendered
      setTimeout(updatePosition, 0);
      
      // Update position on scroll
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  const hasActions =
    onView || onEdit || onDelete || onCopyId || customActions.length > 0;

  if (!hasActions) return null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
        style={{
          color: "var(--theme-text-secondary)",
        }}
        aria-label="Actions"
        aria-expanded={isOpen}
      >
        <MoreDotIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-99999 rounded-lg border shadow-theme-lg min-w-[160px]"
          style={{
            backgroundColor: "var(--theme-surface)",
            borderColor: "var(--theme-border)",
          }}
        >
          <div className="px-2 py-1.5 border-b" style={{ borderColor: "var(--theme-border)" }}>
            <h3
              className="text-xs font-semibold uppercase"
              style={{ color: "var(--theme-text-tertiary)" }}
            >
              Actions
            </h3>
          </div>
          <div className="py-1">
            {onCopyId && (
              <button
                onClick={() => {
                  onCopyId(row);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                style={{ color: "var(--theme-text-primary)" }}
              >
                <CopyIcon className="w-4 h-4" />
                <span>Copy ID</span>
              </button>
            )}
            {onView && (
              <button
                onClick={() => {
                  onView(row);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                style={{ color: "var(--theme-text-primary)" }}
              >
                <EyeIcon className="w-4 h-4" />
                <span>View</span>
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(row);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                style={{ color: "var(--theme-text-primary)" }}
              >
                <PencilIcon className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(row);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                style={{ color: "#f04438" }}
              >
                <TrashBinIcon className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
            {customActions.length > 0 && (
              <>
                {(onView || onEdit || onDelete || onCopyId) && (
                  <div className="border-t my-1" style={{ borderColor: "var(--theme-border)" }} />
                )}
                {customActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.onClick(row);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${action.className || ""}`}
                    style={{ 
                      color: "var(--theme-text-primary)",
                      ...action.style 
                    }}
                  >
                    {action.icon && <span className="w-4 h-4">{action.icon}</span>}
                    <span>{action.label}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ActionsDropdown;

