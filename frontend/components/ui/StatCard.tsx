"use client";

import { Card } from "./Card";
import { cn } from "@/lib/utils";

const tones = {
  brand: "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_4px_12px_-2px_rgb(79_70_229/0.5)]",
  green: "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-[0_4px_12px_-2px_rgb(16_185_129/0.5)]",
  amber: "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-[0_4px_12px_-2px_rgb(245_158_11/0.5)]",
  rose: "bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-[0_4px_12px_-2px_rgb(244_63_94/0.5)]",
  slate: "bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-[0_4px_12px_-2px_rgb(100_116_139/0.5)]",
} as const;

export function StatCard({
  label,
  value,
  icon,
  tone = "brand",
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <Card className="group p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-[var(--shadow-lifted)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
              tones[tone],
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
