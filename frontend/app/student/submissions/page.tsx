"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Inbox,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { PageHero } from "@/components/ui/PageHero";
import { api } from "@/lib/api";
import type { Submission } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/lib/useAsyncData";
import { formatDateShort } from "@/lib/utils";

export default function StudentSubmissionsPage() {
  const { data, loading } = useAsyncData(() =>
    api.get<Submission[]>("/api/submissions"),
  );

  const submissions = useMemo(() => data ?? [], [data]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const sorted = useMemo(
    () =>
      [...submissions].sort((a, b) =>
        b.submittedAt.localeCompare(a.submittedAt),
      ),
    [submissions],
  );

  const filtered = useMemo(() => {
    if (!statusFilter) return sorted;
    return sorted.filter((s) => s.status === statusFilter);
  }, [sorted, statusFilter]);

  const total = submissions.length;
  const graded = submissions.filter((s) => s.status === "Graded");
  const pending = submissions.filter(
    (s) => s.status === "Submitted" || s.status === "Returned",
  );
  const returned = submissions.filter((s) => s.status === "Returned");

  const gradedMarks = graded.filter((s) => s.marks !== null);
  const avgMarks =
    gradedMarks.length > 0
      ? (gradedMarks.reduce((sum, s) => sum + (s.marks ?? 0), 0) /
          gradedMarks.length)
          .toFixed(1)
      : null;

  const highest = gradedMarks.length > 0
    ? Math.max(...gradedMarks.map((s) => s.marks ?? 0))
    : null;
  const lowest = gradedMarks.length > 0
    ? Math.min(...gradedMarks.map((s) => s.marks ?? 0))
    : null;

  return (
    <AuthGuard roles={["Student"]}>
      <PageHero
        title="My Submissions"
        subtitle="Review your submitted work, marks, feedback, and attached files."
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton rows={5} />
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="No submissions yet"
          description="You haven't submitted anything yet."
          action={
            <Link href="/student/assignments">
              <Button size="sm">Browse assignments</Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total"
              value={total}
              icon={<Inbox className="h-5 w-5" />}
              tone="brand"
            />
            <StatCard
              label="Graded"
              value={graded.length}
              icon={<CheckCircle2 className="h-5 w-5" />}
              tone="green"
            />
            <StatCard
              label="Pending"
              value={pending.length}
              icon={<Sparkles className="h-5 w-5" />}
              tone="amber"
            />
            <StatCard
              label="Returned"
              value={returned.length}
              icon={<MessageSquare className="h-5 w-5" />}
              tone="slate"
            />
          </div>

          {/* Grade overview */}
          {graded.length > 0 && (
            <div className="mb-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader
                  title="Average grade"
                  subtitle="Your overall performance"
                  action={<TrendingUp className="h-4 w-4 text-slate-400" />}
                />
                <CardBody>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-slate-900">
                      {avgMarks}
                    </span>
                    <span className="text-sm text-slate-500">average marks</span>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardHeader
                  title="Highest"
                  subtitle="Your best result"
                  action={<TrendingUp className="h-4 w-4 text-emerald-400" />}
                />
                <CardBody>
                  <span className="text-4xl font-bold text-emerald-600">
                    {highest}
                  </span>
                </CardBody>
              </Card>
              <Card>
                <CardHeader
                  title="Lowest"
                  subtitle="Room for improvement"
                  action={<TrendingUp className="h-4 w-4 text-amber-400" />}
                />
                <CardBody>
                  <span className="text-4xl font-bold text-amber-600">
                    {lowest}
                  </span>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Filter */}
          <div className="mb-4 flex items-center gap-2">
            {["", "Submitted", "Graded", "Returned"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {status || "All"}
              </button>
            ))}
          </div>

          {/* Submission list */}
          <div className="space-y-3">
            {filtered.map((s) => {
              const expanded = expandedId === s.id;
              return (
                <Card
                  key={s.id}
                  className="transition-all duration-150 hover:border-slate-300"
                >
                  <div
                    className="flex cursor-pointer items-start justify-between gap-3 p-5"
                    onClick={() =>
                      setExpandedId(expanded ? null : s.id)
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {s.assignmentTitle}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Submitted {formatDateShort(s.submittedAt)} · Deadline{" "}
                        {formatDateShort(s.deadline)}
                      </p>
                      {s.marks !== null && (
                        <p className="mt-1 text-xs font-semibold text-emerald-600">
                          {s.marks} marks{graded.length > 0 && s.status === "Graded" ? " · Graded" : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <SubmissionStatusBadge status={s.status} />
                      {expanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t border-slate-100 p-5 pt-4">
                      {/* Answer */}
                      {s.answer && (
                        <div className="mb-4 rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-100">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Your answer
                          </p>
                          <p className="whitespace-pre-wrap text-sm text-slate-700">
                            {s.answer}
                          </p>
                        </div>
                      )}

                      {/* Files */}
                      {s.attachments.length > 0 && (
                        <div className="mb-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Attached files ({s.attachments.length})
                          </p>
                          <div className="space-y-1">
                            {s.attachments.map((att) => (
                              <div
                                key={att.id}
                                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                              >
                                <span className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-slate-400" />
                                  {att.fileName}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {(att.fileSize / 1024).toFixed(1)} KB
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Feedback */}
                      {s.feedback && (
                        <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                            Teacher feedback
                          </p>
                          <p className="text-sm text-emerald-800">
                            {s.feedback}
                          </p>
                        </div>
                      )}

                      {/* Marks */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                          Marks:{" "}
                          {s.marks !== null && s.marks !== undefined ? (
                            <strong className="text-slate-900">{s.marks}</strong>
                          ) : (
                            <span className="text-slate-400">
                              Not graded yet
                            </span>
                          )}
                        </p>
                        <Link
                          href={`/student/assignments/${s.assignmentId}`}
                        >
                          <Button size="xs" variant="outline">
                            <ExternalLink className="h-3.5 w-3.5" />
                            View assignment
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </AuthGuard>
  );
}
