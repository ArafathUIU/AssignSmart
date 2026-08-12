"use client";

import { useMemo } from "react";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { PageHero } from "@/components/ui/PageHero";
import { api } from "@/lib/api";
import type { Assignment, Submission } from "@/lib/types";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/lib/useAsyncData";

export default function TeacherPerformancePage() {
  const { data, loading } = useAsyncData(async () => {
    const [assignments, submissions] = await Promise.all([
      api.get<Assignment[]>("/api/assignments"),
      api.get<Submission[]>("/api/submissions"),
    ]);
    return { assignments, submissions };
  });

  const assignments = useMemo(() => data?.assignments ?? [], [data]);
  const submissions = useMemo(() => data?.submissions ?? [], [data]);

  const total = assignments.length;
  const published = assignments.filter((a) => a.isPublished).length;
  const totalSubs = submissions.length;
  const graded = submissions.filter((s) => s.status === "Graded").length;
  const pending = submissions.filter((s) => s.status !== "Graded").length;

  const subRate = total > 0 ? Math.round((totalSubs / (total * 25)) * 100) : 0;
  const gradeRate = totalSubs > 0 ? Math.round((graded / totalSubs) * 100) : 0;

  const avgMarks =
    graded > 0
      ? (
          submissions
            .filter((s) => s.status === "Graded")
            .reduce((sum, s) => sum + (s.marks ?? 0), 0) / graded
        ).toFixed(1)
      : null;

  const perAssignment = useMemo(() => {
    return assignments
      .map((a) => {
        const subs = submissions.filter((s) => s.assignmentId === a.id);
        const g = subs.filter((s) => s.status === "Graded");
        const avg = g.length > 0
          ? (g.reduce((sum, s) => sum + (s.marks ?? 0), 0) / g.length).toFixed(1)
          : null;
        return { assignment: a, totalSubs: subs.length, graded: g.length, avg };
      })
      .sort((a, b) => b.totalSubs - a.totalSubs);
  }, [assignments, submissions]);

  return (
    <AuthGuard roles={["Teacher"]}>
      <PageHero
        title="Performance"
        subtitle="Overview of your assignments, submissions and grading progress."
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton rows={6} />
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-6 w-6" />}
          title="No data yet"
          description="Create assignments and receive submissions to see performance data."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Assignments" value={total} icon={<BookOpen className="h-5 w-5" />} tone="brand" />
            <StatCard label="Published" value={published} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
            <StatCard label="Submissions" value={totalSubs} icon={<Users className="h-5 w-5" />} tone="amber" />
            <StatCard label="Graded" value={graded} icon={<Sparkles className="h-5 w-5" />} tone="slate" />
            <StatCard label="Avg marks" value={avgMarks ?? "—"} icon={<BarChart3 className="h-5 w-5" />} tone="rose" />
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Submission rate" subtitle="Submissions received vs expected" action={<Users className="h-4 w-4 text-slate-400" />} />
              <CardBody>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-bold text-slate-900">{totalSubs}</span>
                  <span className="text-sm text-slate-500">received</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500" style={{ width: `${Math.min(100, subRate)}%` }} />
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Grading progress" subtitle={`${graded} of ${totalSubs} graded`} action={<CheckCircle2 className="h-4 w-4 text-slate-400" />} />
              <CardBody>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-bold text-slate-900">{gradeRate}%</span>
                  <span className="text-sm text-slate-500">{pending} pending</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: `${gradeRate}%` }} />
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Per-assignment breakdown" subtitle="Submissions and average marks per assignment" action={<GraduationCap className="h-4 w-4 text-slate-400" />} />
            <CardBody className="p-0">
              <div className="divide-y divide-slate-100">
                {perAssignment.map(({ assignment, totalSubs, graded: g, avg }) => (
                  <div key={assignment.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{assignment.title}</p>
                      <p className="text-xs text-slate-500">{assignment.subjectName} · {assignment.className}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-600">{totalSubs} subs</span>
                      <span className="text-slate-600">{g} graded</span>
                      {avg && <span className="font-semibold text-slate-900">{avg} avg</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </AuthGuard>
  );
}
