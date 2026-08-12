"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHero({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white shadow-[0_4px_24px_rgb(0_0_0/0.15)] sm:p-8",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-500/15 blur-[60px]" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-amber-500/10 blur-[40px]" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 max-w-xl text-sm text-slate-400">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      {children && <div className="relative mt-6">{children}</div>}
    </div>
  );
}
