"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "xs" | "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[0_1px_2px_rgb(15_23_42/0.12),inset_0_1px_0_rgb(255_255_255/0.12)] hover:from-brand-600 hover:to-brand-700 hover:shadow-[var(--shadow-glow)] active:from-brand-700 active:to-brand-800 focus-visible:outline-brand-600 disabled:hover:shadow-[0_1px_2px_rgb(15_23_42/0.12)] disabled:hover:from-brand-500 disabled:hover:to-brand-600",
  secondary:
    "border border-slate-200 bg-slate-100/70 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 active:bg-slate-200 focus-visible:outline-slate-400",
  outline:
    "border border-slate-300 bg-white text-slate-700 shadow-[0_1px_2px_rgb(15_23_42/0.04)] hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-slate-400",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400",
  danger:
    "bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[0_1px_2px_rgb(15_23_42/0.12),inset_0_1px_0_rgb(255_255_255/0.12)] hover:from-rose-600 hover:to-rose-700 active:from-rose-700 active:to-rose-800 focus-visible:outline-rose-600 disabled:hover:from-rose-500 disabled:hover:to-rose-600",
};

const sizeClasses: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs gap-1.5",
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export { Button };
