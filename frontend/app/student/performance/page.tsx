"use client";

import { useMemo } from "react";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Trophy,
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

export default function StudentPerformancePage() {
  const { data, loading } = useAsyncData(async () => {
    const [a, s] = await Promise.all([
      api.get<Assignment[]>("/api/assignments"),
      api.get<Submission[]>("/api/submissions"),
    ]);
    return { assignments: a, submissions: s };
  });

  const assignments = useMemo(() => data?.assignments ?? [], [data]);
  const submissions = useMemo(() => data?.submissions ?? [], [data]);

  const submissionByAssignment = useMemo(
    () => new Map(submissions.map((s) => [s.assignmentId, s])),
    [submissions],
  );

  const graded = useMemo(
    () => submissions.filter((s) => s.status === "Graded"),
    [submissions],
  );

  const total = assignments.length;
  const submitted = submissions.length;
  const gradedCount = graded.length;
  const pending = submissions.filter(
    (s) => s.status !== "Graded",
  ).length;
  const overdue = assignments.filter(
    (a) => !submissionByAssignment.has(a.id) && new Date(a.deadline) < new Date(),
  ).length;

  const completionRate =
    total > 0 ? Math.round((submitted / total) * 100) : 0;
  const passingRate =
    total > 0 ? Math.round((gradedCount / total) * 100) : 0;

  const totalMarks = graded.reduce((sum, s) => sum + (s.marks ?? 0), 0);
  const maxTotal = graded.reduce((sum, s) => {
    const a = assignments.find((x) => x.id === s.assignmentId);
    return sum + (a?.maxMarks ?? 0);
  }, 0);
  const overallPercent =
    gradedCount > 0 && maxTotal > 0
      ? Math.round((totalMarks / maxTotal) * 100)
      : 0;

  const subjectPerformance = useMemo(() => {
    const map = new Map<
      string,
      { name: string; total: number; max: number; count: number }
    >();
    for (const s of graded) {
      const a = assignments.find((x) => x.id === s.assignmentId);
      const key = a?.subjectId ?? s.assignmentId;
      const entry = map.get(key) ?? {
        name: a?.subjectName ?? "Unknown",
        total: 0,
        max: 0,
        count: 0,
      };
      entry.total += s.marks ?? 0;
      entry.max += a?.maxMarks ?? 0;
      entry.count++;
      map.set(key, entry);
    }
    return [...map.entries()]
      .map(([, v]) => ({
        ...v,
        pct: v.max > 0 ? Math.round((v.total / v.max) * 100) : 0,
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [graded, assignments]);

  const recentTrend = useMemo(
    () =>
      [...graded]
        .sort(
          (a, b) =>
            (b.gradedAt ?? b.submittedAt).localeCompare(
              a.gradedAt ?? a.submittedAt,
            ),
        )
        .slice(0, 8)
        .reverse(),
    [graded],
  );

  const gpa = subjectPerformance.length > 0
    ? (subjectPerformance.reduce((sum, s) => sum + s.pct, 0) / subjectPerformance.length).toFixed(1)
    : null;

  return (
    <AuthGuard roles={["Student"]}>
      <PageHero
        title="Performance"
        subtitle="Your overall academic performance, subject-wise breakdown and recent trends."
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
          icon={<TrendingUp className="h-6 w-6" />}
          title="No data yet"
          description="Performance data will appear as you complete assignments."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard
              label="Overall score"
              value={`${overallPercent}%`}
              icon={<Trophy className="h-5 w-5" />}
              tone="brand"
            />
            <StatCard
              label="GPA estimate"
              value={gpa ? `${gpa}%` : "—"}
              icon={<BarChart3 className="h-5 w-5" />}
              tone="green"
            />
            <StatCard
              label="Completion"
              value={`${completionRate}%`}
              icon={<CheckCircle2 className="h-5 w-5" />}
              tone="amber"
            />
            <StatCard
              label="Passing"
              value={`${passingRate}%`}
              icon={<Sparkles className="h-5 w-5" />}
              tone="slate"
            />
            <StatCard
              label="Overdue"
              value={overdue}
              icon={<Clock className="h-5 w-5" />}
              tone="rose"
            />
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            {/* Subject performance */}
            <Card>
              <CardHeader
                title="Subject-wise performance"
                subtitle="Average score per subject (%)"
                action={<BookOpen className="h-4 w-4 text-slate-400" />}
              />
              <CardBody>
                {subjectPerformance.length === 0 ? (
                  <EmptyState
                    icon={<BarChart3 className="h-5 w-5" />}
                    title="No grades yet"
                    description="Subject performance will appear once assignments are graded."
                  />
                ) : (
                  <div className="space-y-3">
                    {subjectPerformance.map((sp) => (
                      <div key={sp.name}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-900">
                            {sp.name}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            {sp.pct}% ({sp.total}/{sp.max})
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              sp.pct >= 80
                                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                : sp.pct >= 60
                                  ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                  : "bg-gradient-to-r from-rose-400 to-rose-500"
                            }`}
                            style={{ width: `${sp.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Recent grade trend */}
            <Card>
              <CardHeader
                title="Recent grade trend"
                subtitle="Your last 8 graded assignments"
                action={<TrendingUp className="h-4 w-4 text-slate-400" />}
              />
              <CardBody>
                {recentTrend.length === 0 ? (
                  <EmptyState
                    icon={<BarChart3 className="h-5 w-5" />}
                    title="No grades yet"
                    description="Grade trends will appear after your assignments are graded."
                  />
                ) : (
                  <div>
                    <div className="mb-4 flex items-end gap-1.5" style={{ height: 100 }}>
                      {recentTrend.map((s) => {
                        const a = assignments.find(
                          (x) => x.id === s.assignmentId,
                        );
                        const pct = a
                          ? Math.round(((s.marks ?? 0) / a.maxMarks) * 100)
                          : 0;
                        const height = Math.max(8, pct);
                        const barColor =
                          pct >= 80
                            ? "bg-emerald-400"
                            : pct >= 60
                              ? "bg-amber-400"
                              : "bg-rose-400";
                        return (
                          <div
                            key={s.id}
                            className="flex flex-1 flex-col items-center justify-end"
                          >
                            <span className="mb-1 text-[10px] font-semibold text-slate-500">
                              {pct}%
                            </span>
                            <div
                              className={`w-full max-w-[32px] rounded-t-md ${barColor} transition-all`}
                              style={{ height: `${height}%` }}
                            />
                            <span className="mt-1 text-[9px] text-slate-400">
                              {s.assignmentTitle.slice(0, 4)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Trend summary */}
                    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">
                        {recentTrend.length} graded
                      </span>{" "}
                      ·{" "}
                      {recentTrend.filter((s) => {
                        const a = assignments.find(
                          (x) => x.id === s.assignmentId,
                        );
                        return a && (s.marks ?? 0) / a.maxMarks >= 0.8;
                      }).length}{" "}
                      scored 80%+ · Average trend from newest to oldest bar
                      chart above
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Activity summary */}
          <Card>
            <CardHeader
              title="Activity overview"
              subtitle="Summary of your engagement and results"
              action={<BookOpen className="h-4 w-4 text-slate-400" />}
            />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <p className="text-3xl font-bold text-slate-900">{total}</p>
                  <p className="mt-1 text-xs text-slate-500">Total assignments</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-700">
                    {submitted}
                  </p>
                  <p className="mt-1 text-xs text-emerald-600">Submitted</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4 text-center">
                  <p className="text-3xl font-bold text-amber-700">
                    {pending}
                  </p>
                  <p className="mt-1 text-xs text-amber-600">Pending review</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-4 text-center">
                  <p className="text-3xl font-bold text-rose-700">{overdue}</p>
                  <p className="mt-1 text-xs text-rose-600">Overdue</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </AuthGuard>
  );
}
