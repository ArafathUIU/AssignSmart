"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { subjectMeta } from "./subjectMeta";

export function SubjectTile({
  subjectId,
  subjectName,
  teacherName,
  assignmentCount,
  gradedCount,
  className,
}: {
  subjectId: string;
  subjectName: string;
  teacherName?: string;
  assignmentCount: number;
  gradedCount: number;
  className?: string;
}) {
  const { gradient, Icon } = subjectMeta(subjectName);

  return (
    <Link
      href={`/student/subjects/${subjectId}`}
      className={cn(
        "group relative flex flex-col justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-[0_6px_18px_-4px_rgb(15_23_42/0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lifted)]",
        gradient,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/25 backdrop-blur-sm">
          {Icon}
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>

      <div>
        <p className="truncate text-lg font-bold tracking-tight">
          {subjectName}
        </p>
        {teacherName && (
          <p className="mt-0.5 truncate text-xs font-medium text-white/75">
            {teacherName}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 border-t border-white/20 pt-3 text-xs font-medium text-white/90">
        <span className="flex items-center gap-1.5">
          <ClipboardList className="h-3.5 w-3.5" />
          {assignmentCount} assignment{assignmentCount === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {gradedCount} graded
        </span>
      </div>
    </Link>
  );
}
