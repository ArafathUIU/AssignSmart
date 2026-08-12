"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  AlarmClock,
  BookOpen,
  CheckCircle2,
  Clock,
  ClipboardList,
  Filter,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { PageHero } from "@/components/ui/PageHero";
import { api } from "@/lib/api";
import type { Assignment, Submission } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/lib/useAsyncData";
import { formatDateShort, isPast } from "@/lib/utils";

export default function StudentAssignmentsPage() {
  const { data, loading } = useAsyncData(async () => {
    const [a, s] = await Promise.all([
      api.get<Assignment[]>("/api/assignments"),
      api.get<Submission[]>("/api/submissions"),
    ]);
    return { assignments: a, submissions: s };
  });

  const assignments = useMemo(() => data?.assignments ?? [], [data]);
  const submissions = useMemo(() => data?.submissions ?? [], [data]);

  const [statusFilter, setStatusFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const submissionByAssignment = useMemo(
    () => new Map(submissions.map((s) => [s.assignmentId, s])),
    [submissions],
  );

  const allSubjects = useMemo(
    () => [...new Set(assignments.map((a) => a.subjectName))].sort(),
    [assignments],
  );

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      const s = submissionByAssignment.get(a.id);
      if (subjectFilter && a.subjectName !== subjectFilter) return false;
      if (statusFilter === "open") return !s && !isPast(a.deadline);
      if (statusFilter === "submitted") return !!s;
      if (statusFilter === "overdue") return !s && isPast(a.deadline);
      return true;
    });
  }, [assignments, submissionByAssignment, subjectFilter, statusFilter]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [filtered],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const a of sorted) {
      const key = a.subjectName;
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [sorted]);

  const available = assignments.filter(
    (a) => !submissionByAssignment.has(a.id) && !isPast(a.deadline),
  ).length;
  const submitted = submissions.length;
  const overdue = assignments.filter(
    (a) => !submissionByAssignment.has(a.id) && isPast(a.deadline),
  ).length;
  const graded = submissions.filter((s) => s.status === "Graded").length;
  const passing =
    assignments.length > 0
      ? Math.round((graded / assignments.length) * 100)
      : 0;

  const urgent = sorted.filter((a) => {
    if (submissionByAssignment.has(a.id)) return false;
    const diff = new Date(a.deadline).getTime() - now;
    return diff > 0 && diff < 48 * 60 * 60 * 1000;
  });

  const groupProgress = useMemo(() => {
    const map = new Map<string, { total: number; graded: number }>();
    for (const a of assignments) {
      const key = a.subjectName;
      const entry = map.get(key) ?? { total: 0, graded: 0 };
      entry.total++;
      const s = submissionByAssignment.get(a.id);
      if (s?.status === "Graded") entry.graded++;
      map.set(key, entry);
    }
    return map;
  }, [assignments, submissionByAssignment]);

  return (
    <AuthGuard roles={["Student"]}>
      <PageHero
        title="My Assignments"
        subtitle="Published assignments for your class — submit and track your work."
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
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="No assignments yet"
          description="Published assignments for your class will appear here."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard
              label="Available"
              value={available}
              icon={<BookOpen className="h-5 w-5" />}
              tone="brand"
            />
            <StatCard
              label="Submitted"
              value={submitted}
              icon={<CheckCircle2 className="h-5 w-5" />}
              tone="green"
            />
            <StatCard
              label="Passing rate"
              value={`${passing}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="slate"
            />
            <StatCard
              label="Pending review"
              value={
                submissions.filter((s) => s.status !== "Graded").length
              }
              icon={<Sparkles className="h-5 w-5" />}
              tone="amber"
            />
            <StatCard
              label="Overdue"
              value={overdue}
              icon={<Clock className="h-5 w-5" />}
              tone="rose"
            />
          </div>

          {/* Urgent banner */}
          {urgent.length > 0 && (
            <Card className="mb-6 border-amber-200 bg-amber-50/40">
              <CardHeader
                title={`${urgent.length} assignment${urgent.length === 1 ? "" : "s"} due within 48 hours`}
                subtitle="These need your attention soon"
                action={<AlarmClock className="h-4 w-4 text-amber-500" />}
              />
              <CardBody>
                <div className="space-y-2">
                  {urgent.map((a) => {
                    const diff = new Date(a.deadline).getTime() - now;
                    const hoursLeft = Math.max(
                      0,
                      Math.round(diff / (1000 * 60 * 60)),
                    );
                    return (
                      <Link
                        key={a.id}
                        href={`/student/assignments/${a.id}`}
                        className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-colors hover:bg-amber-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {a.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {a.subjectName} · Due{" "}
                            {formatDateShort(a.deadline)}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-amber-600">
                          {hoursLeft}h left
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              {["", "open", "submitted", "overdue"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s || "All"}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <Select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-40 text-xs"
            >
              <option value="">All subjects</option>
              {allSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </Select>
          </div>

          {/* Grouped by subject */}
          <div className="space-y-6">
            {grouped.map(([subject, items]) => {
              const prog = groupProgress.get(subject);
              const gradedCount = prog?.graded ?? 0;
              const totalCount = prog?.total ?? 0;
              return (
                <Card key={subject}>
                  <CardHeader
                    title={subject}
                    subtitle={`${items.length} assignment${items.length === 1 ? "" : "s"} · ${gradedCount}/${totalCount} graded`}
                    action={<BookOpen className="h-4 w-4 text-slate-400" />}
                  />
                  {totalCount > 0 && (
                    <div className="mx-5 mb-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500"
                        style={{
                          width: `${Math.round((gradedCount / totalCount) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                  <CardBody className={items.length > 0 ? "p-0" : ""}>
                    {items.length === 0 ? (
                      <EmptyState
                        icon={<ClipboardList className="h-5 w-5" />}
                        title="No matching assignments"
                        description="Try changing your filters."
                      />
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {items.map((a) => {
                          const s = submissionByAssignment.get(a.id);
                          const closed = isPast(a.deadline);
                          const diff =
                            new Date(a.deadline).getTime() - now;
                          const hoursLeft = Math.max(
                            0,
                            Math.round(diff / (1000 * 60 * 60)),
                          );
                          const daysLeft = Math.floor(hoursLeft / 24);
                          return (
                            <div
                              key={a.id}
                              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50/60"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900">
                                  {a.title}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                                  <span>{a.teacherName}</span>
                                  <span>{a.maxMarks} marks</span>
                                  <span
                                    className={
                                      closed && !s
                                        ? "font-medium text-rose-600"
                                        : ""
                                    }
                                  >
                                    Due {formatDateShort(a.deadline)}
                                  </span>
                                  {!s &&
                                    !closed &&
                                    (daysLeft > 0 ? (
                                      <span className="font-medium text-amber-600">
                                        {daysLeft}d left
                                      </span>
                                    ) : (
                                      <span className="font-medium text-rose-500">
                                        {hoursLeft}h left
                                      </span>
                                    ))}
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
                          );
                        })}
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </AuthGuard>
  );
}
