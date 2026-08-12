"use client";

import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  rows = 3,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-lg bg-gradient-to-r from-slate-200/60 via-slate-200 to-slate-200/60",
            className ?? (i === 0 ? "h-10" : "h-4"),
          )}
        />
      ))}
    </div>
  );
}
