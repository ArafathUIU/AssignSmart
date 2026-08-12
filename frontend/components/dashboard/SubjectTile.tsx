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
  const { color, Icon } = subjectMeta(subjectName);

  return (
    <Link
      href={`/student/subjects/${subjectId}`}
      className={cn(
        "group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgb(0_0_0/0.04)] transition-all hover:border-slate-300 hover:shadow-[0_4px_12px_rgb(0_0_0/0.06)]",
        className,
      )}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {Icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
          {subjectName}
        </p>
        {teacherName && (
          <p className="mt-0.5 text-xs text-slate-500">{teacherName}</p>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ClipboardList className="h-3 w-3" />
            {assignmentCount} assignments
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {gradedCount} graded
          </span>
        </div>
      </div>
      <span className="mt-1 opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowRight className="h-4 w-4 text-slate-300" />
      </span>
    </Link>
  );
}
