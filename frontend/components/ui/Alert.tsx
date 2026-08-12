"use client";

import { AlertTriangle, CheckCircle2, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info" | "warning";

const toneConfig: Record<
  Tone,
  { icon: typeof Info; classes: string; iconClasses: string }
> = {
  success: {
    icon: CheckCircle2,
    classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
    iconClasses: "text-emerald-500",
  },
  error: {
    icon: XCircle,
    classes: "border-rose-200 bg-rose-50 text-rose-800",
    iconClasses: "text-rose-500",
  },
  info: {
    icon: Info,
    classes: "border-brand-200 bg-brand-50 text-brand-800",
    iconClasses: "text-brand-500",
  },
  warning: {
    icon: AlertTriangle,
    classes: "border-amber-200 bg-amber-50 text-amber-800",
    iconClasses: "text-amber-500",
  },
};

export function Alert({
  tone = "info",
  title,
  children,
  onClose,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  const config = toneConfig[tone];
  const Icon = config.icon;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        config.classes,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.iconClasses)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="mt-0.5">{children}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
