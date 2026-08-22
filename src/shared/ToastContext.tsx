import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  toastsEnabled: boolean;
  setToastsEnabled: (enabled: boolean) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [toastsEnabled, setToastsEnabled] = useState(true);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", title?: string) => {
      if (!toastsEnabled) return;
      const id = Date.now().toString() + Math.random().toString();
      setToasts((prev) => [...prev, { id, message, type, title }]);

      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [toastsEnabled, removeToast]
  );

  const success = useCallback((msg: string, title?: string) => showToast(msg, "success", title), [showToast]);
  const error = useCallback((msg: string, title?: string) => showToast(msg, "error", title), [showToast]);
  const info = useCallback((msg: string, title?: string) => showToast(msg, "info", title), [showToast]);
  const warning = useCallback((msg: string, title?: string) => showToast(msg, "warning", title), [showToast]);

  return (
    <ToastContext.Provider
      value={{ showToast, success, error, info, warning, toastsEnabled, setToastsEnabled }}
    >
      {children}

      {/* Floating Bottom-Right Toast Container */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "380px",
          width: "calc(100vw - 48px)",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          const isWarning = toast.type === "warning";

          const bg = isSuccess
            ? "#ecfdf5"
            : isError
            ? "#fef2f2"
            : isWarning
            ? "#fffbeb"
            : "#f0f9ff";

          const border = isSuccess
            ? "#a7f3d0"
            : isError
            ? "#fecaca"
            : isWarning
            ? "#fde68a"
            : "#bae6fd";

          const textColor = isSuccess
            ? "#065f46"
            : isError
            ? "#991b1b"
            : isWarning
            ? "#92400e"
            : "#075985";

          const IconComponent = isSuccess
            ? CheckCircle2
            : isError
            ? AlertCircle
            : isWarning
            ? AlertCircle
            : Info;

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: "auto",
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: "12px",
                padding: "12px 16px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                animation: "slideInToast 0.25s ease-out forwards",
              }}
            >
              <IconComponent size={20} style={{ color: textColor, flexShrink: 0, marginTop: "2px" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {toast.title && (
                  <strong style={{ display: "block", fontSize: "13.5px", color: textColor, marginBottom: "2px" }}>
                    {toast.title}
                  </strong>
                )}
                <p style={{ margin: 0, fontSize: "13px", color: textColor, lineHeight: 1.4, wordBreak: "break-word" }}>
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: textColor,
                  opacity: 0.7,
                  cursor: "pointer",
                  padding: "2px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
