"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  GraduationCap,
  Inbox,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { PageHero } from "@/components/ui/PageHero";
import { api } from "@/lib/api";
import type { Assignment, Submission, TeacherAssignment } from "@/lib/types";
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { formatDateShort, isPast } from "@/lib/utils";

export default function StudentSubjectDetailPage(
  props: PageProps<"/student/subjects/[id]">,
) {
  const { id } = use(props.params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState<{
    subjectId: string;
    subjectName: string;
    teacherName: string;
  } | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [all, subs, attended] = await Promise.all([
          api.get<Assignment[]>("/api/assignments"),
          api.get<Submission[]>("/api/submissions"),
          api.get<TeacherAssignment[]>("/api/teacher-assignments/my-class"),
        ]);
        if (cancelled) return;
        const meta = attended.find((t) => t.subjectId === id);
        const subjectAssignments = all.filter((a) => a.subjectId === id);
        setSubject({
          subjectId: id,
          subjectName: meta?.subjectName ?? subjectAssignments[0]?.subjectName ?? "Subject",
          teacherName: meta?.teacherName ?? subjectAssignments[0]?.teacherName ?? "",
        });
        setAssignments(subjectAssignments);
        setSubmissions(subs);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const submissionByAssignment = new Map(
    submissions.map((s) => [s.assignmentId, s]),
  );

  const graded = assignments.filter(
    (a) => submissionByAssignment.get(a.id)?.status === "Graded",
  );
  const pending = assignments.filter((a) => {
    const s = submissionByAssignment.get(a.id);
    return s && s.status !== "Graded";
  });
  const notSubmitted = assignments.filter(
    (a) => !submissionByAssignment.has(a.id),
  );

  const gradedCount = graded.length;
  const pendingCount = pending.length;
  const notSubmittedCount = notSubmitted.length;

  const totalMarks = graded.reduce((sum, a) => {
    const s = submissionByAssignment.get(a.id);
    return sum + (s?.marks ?? 0);
  }, 0);
  const maxTotal = graded.reduce((sum, a) => sum + a.maxMarks, 0);
  const averagePercent =
    gradedCount > 0 && maxTotal > 0
      ? Math.round((totalMarks / maxTotal) * 100)
      : null;
  const completionPercent =
    assignments.length > 0
      ? Math.round((gradedCount / assignments.length) * 100)
      : 0;

  const grouped = [
    { label: "Pending", items: notSubmitted, icon: Clock, empty: "Nothing pending" },
    { label: "In Review", items: pending, icon: Sparkles, empty: "Nothing under review" },
    { label: "Graded", items: graded, icon: CheckCircle2, empty: "No graded work yet" },
  ];

  return (
    <AuthGuard roles={["Student"]}>
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton rows={8} />
        </div>
      ) : error ? (
        <Alert tone="error" title="Unable to load">{error}</Alert>
      ) : (
        <>
          <PageHero
            title={subject?.subjectName ?? "Subject"}
            subtitle={
              subject?.teacherName
                ? `Taught by ${subject.teacherName} · ${assignments.length} assignment${assignments.length === 1 ? "" : "s"}`
                : `${assignments.length} assignment${assignments.length === 1 ? "" : "s"}`
            }
            className="relative"
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-500/15 blur-[60px]" />
          </PageHero>

          {/* Score overview */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Assignments"
              value={assignments.length}
              icon={<BookOpen className="h-5 w-5" />}
              tone="brand"
            />
            <StatCard
              label="Not submitted"
              value={notSubmittedCount}
              icon={<Inbox className="h-5 w-5" />}
              tone="rose"
            />
            <StatCard
              label="In review"
              value={pendingCount}
              icon={<Sparkles className="h-5 w-5" />}
              tone="amber"
            />
            <StatCard
              label="Graded"
              value={gradedCount}
              icon={<CheckCircle2 className="h-5 w-5" />}
              tone="green"
            />
          </div>

          {/* Progress + Grade summary */}
          <div className="mb-6 grid gap-6 sm:grid-cols-2">
            {/* Completion progress */}
            <Card>
              <CardHeader
                title="Completion"
                subtitle={`${gradedCount} of ${assignments.length} assignments graded`}
                action={<TrendingUp className="h-4 w-4 text-slate-400" />}
              />
              <CardBody>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-bold text-slate-900">
                    {completionPercent}%
                  </span>
                  <span className="text-sm text-slate-500">completed</span>
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Average grade */}
            <Card>
              <CardHeader
                title="Average grade"
                subtitle={
                  averagePercent !== null
                    ? `Based on ${gradedCount} graded assignment${gradedCount === 1 ? "" : "s"}`
                    : "No grades yet"
                }
                action={<CheckCircle2 className="h-4 w-4 text-slate-400" />}
              />
              <CardBody>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-bold text-slate-900">
                    {averagePercent !== null ? `${averagePercent}%` : "—"}
                  </span>
                  <span className="text-sm text-slate-500">
                    {averagePercent !== null
                      ? `${totalMarks} / ${maxTotal} marks`
                      : "awaiting grades"}
                  </span>
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-500"
                    style={{ width: `${averagePercent ?? 0}%` }}
                  />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Assignments grouped by status */}
          {grouped.map((group) => {
            const hasItems = group.items.length > 0;
            return (
              <div key={group.label} className="mb-6">
                <Card>
                  <CardHeader
                    title={group.label}
                    subtitle={
                      hasItems
                        ? `${group.items.length} assignment${group.items.length === 1 ? "" : "s"}`
                        : group.empty
                    }
                    action={<group.icon className="h-4 w-4 text-slate-400" />}
                  />
                  {hasItems && (
                    <CardBody className="p-0">
                      <div className="divide-y divide-slate-100">
                        {group.items
                          .sort((a, b) => a.deadline.localeCompare(b.deadline))
                          .map((a) => {
                            const s = submissionByAssignment.get(a.id);
                            const closed = isPast(a.deadline);
                            return (
                              <div
                                key={a.id}
                                className="px-5 py-4 transition-colors hover:bg-slate-50/60"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <Link
                                      href={`/student/assignments/${a.id}`}
                                      className="text-sm font-semibold text-slate-900 transition-colors hover:text-brand-600"
                                    >
                                      {a.title}
                                    </Link>
                                    {a.description && (
                                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                        {a.description}
                                      </p>
                                    )}
                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                      <span className="flex items-center gap-1">
                                        <CalendarClock className="h-3 w-3" />
                                        <span
                                          className={
                                            closed && !s
                                              ? "font-medium text-rose-600"
                                              : ""
                                          }
                                        >
                                          Due {formatDateShort(a.deadline)}
                                        </span>
                                      </span>
                                      <span>{a.maxMarks} marks</span>
                                      {s?.marks !== null &&
                                        s?.marks !== undefined && (
                                          <span className="font-semibold text-emerald-600">
                                            {s.marks}/{a.maxMarks}
                                          </span>
                                        )}
                                      {s?.feedback && (
                                        <span className="flex items-center gap-1 text-slate-400">
                                          <MessageSquare className="h-3 w-3" />
                                          {s.feedback.length > 50
                                            ? s.feedback.slice(0, 50) + "…"
                                            : s.feedback}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {s ? (
                                      <SubmissionStatusBadge
                                        status={s.status}
                                      />
                                    ) : closed ? (
                                      <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-600 ring-1 ring-inset ring-rose-200">
                                        Missed
                                      </span>
                                    ) : (
                                      <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600 ring-1 ring-inset ring-brand-200">
                                        Open
                                      </span>
                                    )}
                                    <Link
                                      href={`/student/assignments/${a.id}`}
                                    >
                                      <Button size="xs" variant="outline">
                                        {s
                                          ? closed
                                            ? "View"
                                            : "Update"
                                          : closed
                                            ? "View"
                                            : "Submit"}
                                      </Button>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardBody>
                  )}
                </Card>
              </div>
            );
          })}

          {assignments.length === 0 && (
            <EmptyState
              icon={<GraduationCap className="h-6 w-6" />}
              title="No assignments"
              description="No assignments have been published for this subject yet."
              action={
                <Link href="/student/assignments">
                  <Button size="sm" variant="outline">
                    Browse all assignments
                  </Button>
                </Link>
              }
            />
          )}
        </>
      )}
    </AuthGuard>
  );
}
