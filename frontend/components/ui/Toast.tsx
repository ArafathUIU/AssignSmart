"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; tone: ToastTone; message: string };

interface ToastContextValue {
  toast: (tone: ToastTone, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (tone: ToastTone, message: string) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, tone, message }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const success = useCallback(
    (message: string) => toast("success", message),
    [toast],
  );
  const error = useCallback(
    (message: string) => toast("error", message),
    [toast],
  );
  const info = useCallback(
    (message: string) => toast("info", message),
    [toast],
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((t) => {
          const Icon =
            t.tone === "success"
              ? CheckCircle2
              : t.tone === "error"
                ? XCircle
                : Info;
          const iconColor =
            t.tone === "success"
              ? "text-emerald-500"
              : t.tone === "error"
                ? "text-rose-500"
                : "text-brand-500";
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex animate-toast-in items-start gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-[var(--shadow-lifted)]"
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
              <p className="flex-1 text-sm text-slate-700">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
