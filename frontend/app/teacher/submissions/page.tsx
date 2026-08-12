"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Inbox,
  MessageSquare,
  Pencil,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { PageHero } from "@/components/ui/PageHero";
import { api } from "@/lib/api";
import type { Submission } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAsyncData } from "@/lib/useAsyncData";
import { formatDateShort } from "@/lib/utils";

export default function TeacherSubmissionsPage() {
  const { success, error: notifyError } = useToast();
  const { data, loading, refresh } = useAsyncData(() =>
    api.get<Submission[]>("/api/submissions"),
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");

  const submissions = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return submissions.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (query) {
        return (
          s.studentName.toLowerCase().includes(query) ||
          s.assignmentTitle.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [submissions, search, statusFilter]);

  const total = submissions.length;
  const pending = submissions.filter(
    (s) => s.status === "Submitted" || s.status === "Returned",
  );
  const graded = submissions.filter((s) => s.status === "Graded");

  const grouped = useMemo(() => {
    const map = new Map<string, Submission[]>();
    for (const s of filtered) {
      const key = s.assignmentId;
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => {
      const latestA = Math.max(...a[1].map((s) => new Date(s.submittedAt).getTime()));
      const latestB = Math.max(...b[1].map((s) => new Date(s.submittedAt).getTime()));
      return latestB - latestA;
    });
  }, [filtered]);

  async function handleQuickGrade(submissionId: string) {
    if (!gradeMarks) return;
    try {
      await api.put(`/api/submissions/${submissionId}/grade`, {
        marks: Number(gradeMarks),
        feedback: gradeFeedback || null,
      });
      success("Graded successfully.");
      setGradingId(null);
      setGradeMarks("");
      setGradeFeedback("");
      await refresh();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Grading failed.");
    }
  }

  function openGrade(s: Submission) {
    setGradingId(s.id);
    setGradeMarks(s.marks !== null ? String(s.marks) : "");
    setGradeFeedback(s.feedback ?? "");
  }

  const groupedExpanded = new Set(
    graded.length > 0
      ? grouped.map(([id]) => id)
      : grouped.slice(0, 3).map(([id]) => id),
  );

  return (
    <AuthGuard roles={["Teacher"]}>
      <PageHero
        title="Submissions"
        subtitle={`${total} submissions · ${pending.length} pending review`}
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton rows={8} />
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="No submissions yet"
          description="Students haven't submitted to your assignments yet."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total"
              value={total}
              icon={<Inbox className="h-5 w-5" />}
              tone="brand"
            />
            <StatCard
              label="Pending review"
              value={pending.length}
              icon={<Sparkles className="h-5 w-5" />}
              tone="amber"
            />
            <StatCard
              label="Graded"
              value={graded.length}
              icon={<CheckCircle2 className="h-5 w-5" />}
              tone="green"
            />
            <StatCard
              label="Assignments"
              value={grouped.length}
              icon={<GraduationCap className="h-5 w-5" />}
              tone="slate"
            />
          </div>

          {/* Pending review queue */}
          {pending.length > 0 && (
            <Card className="mb-6 border-amber-200 bg-amber-50/40">
              <CardHeader
                title={`Pending review — ${pending.length} submission${pending.length === 1 ? "" : "s"} waiting`}
                subtitle="These need your attention first"
                action={<Sparkles className="h-4 w-4 text-amber-500" />}
              />
              <CardBody>
                <div className="space-y-2">
                  {pending.slice(0, 5).map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 shadow-[0_1px_2px_rgb(0_0_0/0.03)]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {s.studentName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {s.assignmentTitle} ·{" "}
                          {formatDateShort(s.submittedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <SubmissionStatusBadge status={s.status} />
                        {gradingId === s.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={gradeMarks}
                              onChange={(e) =>
                                setGradeMarks(e.target.value)
                              }
                              placeholder="Marks"
                              className="h-8 w-20 rounded-lg border border-slate-200 px-2 text-sm"
                            />
                            <button
                              onClick={() => handleQuickGrade(s.id)}
                              className="rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
                            >
                              Grade
                            </button>
                            <button
                              onClick={() => setGradingId(null)}
                              className="text-xs text-slate-400 hover:text-slate-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openGrade(s)}
                              className="rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                            >
                              Quick grade
                            </button>
                            <Link href={`/teacher/assignments/${s.assignmentId}`}>
                              <Button size="xs" variant="ghost">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {pending.length > 5 && (
                    <p className="text-center text-xs text-amber-600">
                      +{pending.length - 5} more pending
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Search & filter */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student or assignment..."
                className="pl-9"
                aria-label="Search submissions"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sm:w-44"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Graded">Graded</option>
              <option value="Returned">Returned</option>
            </Select>
          </div>

          {/* Grouped by assignment */}
          <div className="space-y-4">
            {grouped.map(([assignmentId, subs]) => {
              const isExpanded =
                expandedAssignment === assignmentId ||
                groupedExpanded.has(assignmentId);
              const title = subs[0]?.assignmentTitle ?? "Assignment";
              const pendingCount = subs.filter(
                (s) => s.status === "Submitted" || s.status === "Returned",
              ).length;
              const gradedCount = subs.filter(
                (s) => s.status === "Graded",
              ).length;
              return (
                <Card key={assignmentId}>
                  <div
                    className="flex cursor-pointer items-center justify-between px-5 py-4"
                    onClick={() =>
                      setExpandedAssignment(
                        isExpanded ? null : assignmentId,
                      )
                    }
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {subs.length} submission
                        {subs.length === 1 ? "" : "s"} · {gradedCount} graded
                        {pendingCount > 0
                          ? ` · ${pendingCount} pending`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100">
                      {subs.map((s) => (
                        <div
                          key={s.id}
                          className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-50 px-5 py-3 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              {s.studentName}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Submitted {formatDateShort(s.submittedAt)}
                            </p>
                            {s.answer && (
                              <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                                {s.answer}
                              </p>
                            )}
                            {s.marks !== null && (
                              <p className="mt-1 text-xs font-semibold text-emerald-600">
                                {s.marks} marks
                              </p>
                            )}
                            {s.feedback && (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                <MessageSquare className="h-3 w-3" />
                                {s.feedback}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <SubmissionStatusBadge status={s.status} />
                            {gradingId === s.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={gradeMarks}
                                  onChange={(e) =>
                                    setGradeMarks(e.target.value)
                                  }
                                  placeholder="Marks"
                                  className="h-7 w-16 rounded-lg border border-slate-200 px-2 text-xs"
                                />
                                <input
                                  value={gradeFeedback}
                                  onChange={(e) =>
                                    setGradeFeedback(e.target.value)
                                  }
                                  placeholder="Feedback..."
                                  className="h-7 w-28 rounded-lg border border-slate-200 px-2 text-xs"
                                />
                                <button
                                  onClick={() => handleQuickGrade(s.id)}
                                  className="rounded-lg bg-slate-900 p-1.5 text-white hover:bg-slate-800"
                                >
                                  <Send className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => setGradingId(null)}
                                  className="text-xs text-slate-400 hover:text-slate-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openGrade(s);
                                }}
                                className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                              >
                                <Pencil className="mr-1 inline h-3 w-3" />
                                Grade
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
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
