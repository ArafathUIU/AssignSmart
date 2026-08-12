"use client";

import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "green" | "amber" | "rose" | "slate";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-600/15",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/15",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/15",
  slate: "bg-slate-50 text-slate-500 ring-slate-200",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DotBadge({
  tone = "neutral",
  label,
}: {
  tone?: Tone;
  label: string;
}) {
  const dot: Record<Tone, string> = {
    neutral: "bg-slate-400",
    brand: "bg-brand-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    slate: "bg-slate-400",
  };
  return (
    <Badge tone={tone}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[tone])} aria-hidden />
      {label}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const tone: Tone =
    role === "Admin" ? "brand" : role === "Teacher" ? "amber" : "green";
  return <Badge tone={tone}>{role}</Badge>;
}

export function AssignmentStatusBadge({ published }: { published: boolean }) {
  return published ? (
    <DotBadge tone="green" label="Published" />
  ) : (
    <DotBadge tone="slate" label="Draft" />
  );
}

export function SubmissionStatusBadge({
  status,
}: {
  status: "Submitted" | "Graded" | "Returned" | string;
}) {
  const tone: Tone =
    status === "Graded"
      ? "green"
      : status === "Returned"
        ? "amber"
        : "brand";
  return <DotBadge tone={tone} label={status} />;
}
