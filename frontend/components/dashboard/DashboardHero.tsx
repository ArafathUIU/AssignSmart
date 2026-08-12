"use client";

import { Sparkles } from "lucide-react";
import { greetingFor } from "@/lib/utils";
import { cn } from "@/lib/utils";

const roleGlow: Record<string, string> = {
  Admin: "from-violet-500 to-purple-600",
  Teacher: "from-sky-500 to-indigo-600",
  Student: "from-emerald-500 to-teal-600",
};

export function DashboardHero({
  name,
  role,
  subtitle,
  action,
}: {
  name: string;
  role: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const first = name.trim().split(/\s+/)[0] ?? "there";
  const glow = roleGlow[role] ?? "from-brand-500 to-indigo-600";

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white shadow-[0_4px_24px_rgb(0_0_0/0.15)] sm:p-8">
      <div
        className={cn(
          "pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gradient-to-br opacity-20 blur-3xl",
          glow,
        )}
      />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-gradient-to-tr from-brand-100 to-transparent opacity-60 blur-3xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-brand-300">
            <Sparkles className="h-3.5 w-3.5" />
            {greetingFor()}
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {first}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>
        </div>
        {action && <div className="relative">{action}</div>}
      </div>
    </div>
  );
}
