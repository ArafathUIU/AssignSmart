"use client";

import { useState } from "react";
import { ChevronDown, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { subjectMeta } from "./subjectMeta";
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { formatDate, isPast } from "@/lib/utils";
import type { Assignment, Submission } from "@/lib/types";

export interface SubjectEntry {
  subjectId: string;
  subjectName: string;
  assignments: Assignment[];
  submissionByAssignment?: Map<string, Submission>;
}

export function SubjectCard({
  entry,
  hrefPrefix,
}: {
  entry: SubjectEntry;
  hrefPrefix: string;
}) {
  const { gradient, Icon } = subjectMeta(entry.subjectName);
  const [open, setOpen] = useState(false);

  const assignments = [...entry.assignments].sort((a, b) =>
    a.deadline.localeCompare(b.deadline),
  );

  const gradedCount = assignments.filter((a) => {
    const s = entry.submissionByAssignment?.get(a.id);
    return s?.status === "Graded";
  }).length;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-lifted)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50/70"
        aria-expanded={open}
      >
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_4px_12px_-2px_rgb(15_23_42/0.2)]",
            gradient,
          )}
        >
          {Icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-900">
            {entry.subjectName}
          </span>
          <span className="block text-xs text-slate-500">
            {assignments.length} assignment{assignments.length === 1 ? "" : "s"} ·{" "}
            {gradedCount} graded
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="animate-fade-in border-t border-slate-100 bg-slate-50/40 p-3">
          {assignments.length === 0 ? (
            <p className="px-2 py-3 text-center text-sm text-slate-500">
              No assignments for this subject yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {assignments.map((a) => {
                const s = entry.submissionByAssignment?.get(a.id);
                const closed = isPast(a.deadline);
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/70 bg-white p-3"
                  >
                    <div className="min-w-0">
                      <a
                        href={`${hrefPrefix}/${a.id}`}
                        className="block truncate text-sm font-medium text-slate-800 transition-colors hover:text-brand-600"
                      >
                        {a.title}
                      </a>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className={closed ? "font-medium text-rose-600" : ""}>
                            {formatDate(a.deadline)}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {s?.marks !== null && s?.marks !== undefined
                            ? `${s.marks} / ${a.maxMarks}`
                            : `— / ${a.maxMarks}`}
                        </span>
                      </div>
                    </div>
                    {s ? (
                      <SubmissionStatusBadge status={s.status} />
                    ) : (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                        Not submitted
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
