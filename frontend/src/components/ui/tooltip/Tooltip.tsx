"use client";

import React, { useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      // Position tooltip below the element, centered
      setPosition({
        top: triggerRect.bottom + scrollY + 8,
        left: triggerRect.left + scrollX + triggerRect.width / 2,
      });
    }
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        className={`inline-block ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && content && (
        <div
          ref={tooltipRef}
          className="fixed z-99999 px-3 py-2 text-xs font-medium rounded-lg shadow-theme-lg pointer-events-none transition-opacity duration-200"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: "translateX(-50%)",
            backgroundColor: "var(--theme-surface)",
            color: "var(--theme-text-primary)",
            border: "1px solid var(--theme-border)",
            maxWidth: "300px",
            wordWrap: "break-word",
          }}
        >
          {content}
        </div>
      )}
    </>
  );
};

