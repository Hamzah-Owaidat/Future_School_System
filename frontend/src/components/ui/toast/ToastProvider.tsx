"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  message: string;
  durationMs?: number;
}

interface ToastInternal extends Required<Omit<ToastOptions, "id" | "durationMs">> {
  id: string;
  durationMs: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TYPE_STYLES: Record<ToastType, string> = {
  success:
    "border-success-500/40 bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300",
  error:
    "border-error-500/40 bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300",
  warning:
    "border-warning-500/40 bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300",
  info:
    "border-brand-500/40 bg-brand-25 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300",
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ id, type = "info", message, durationMs = 3000 }: ToastOptions) => {
      const toastId = id ?? Math.random().toString(36).slice(2);

      setToasts((prev) => [
        ...prev,
        {
          id: toastId,
          type,
          message,
          durationMs,
        },
      ]);

      // Auto-dismiss after duration
      setTimeout(() => removeToast(toastId), durationMs);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[999999] flex flex-col gap-3 w-full max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-theme-md backdrop-blur-sm transition-opacity duration-200 ${TYPE_STYLES[toast.type]}`}
          >
            <div className="flex-1 text-sm leading-relaxed">{toast.message}</div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-xs font-medium opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
