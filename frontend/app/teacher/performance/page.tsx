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
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/lib/useAsyncData";
import { formatDateShort } from "@/lib/utils";

function PieChart({ segments, size = 140 }: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  let cumulativeAngle = 0;
  const paths: { d: string; color: string }[] = [];
  for (const seg of segments) {
    if (seg.value === 0) continue;
    const angle = (seg.value / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    paths.push({
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: seg.color,
    });
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.45} fill="white" />
      <text x={cx} y={cy - 4} textAnchor="middle" className="text-lg font-bold" fill="#0f172a">
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="text-[10px]" fill="#64748b">
        total
      </text>
    </svg>
  );
}

function HorizontalBar({ pct, color, label, sub }: {
  pct: number;
  color: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{sub ?? `${pct}%`}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(2, pct)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

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
  const gradedList = submissions.filter((s) => s.status === "Graded");
  const graded = gradedList.length;
  const pending = submissions.filter((s) => s.status !== "Graded").length;
  const returned = submissions.filter((s) => s.status === "Returned").length;
  const submitted = submissions.filter((s) => s.status === "Submitted").length;

  const gradeRate = totalSubs > 0 ? Math.round((graded / totalSubs) * 100) : 0;

  const avgMarks =
    graded > 0
      ? (gradedList.reduce((sum, s) => sum + (s.marks ?? 0), 0) / graded).toFixed(1)
      : null;

  // Grade distribution
  const gradeDistribution = useMemo(() => {
    const bins = [
      { label: "90%+", min: 90, color: "#10b981" },
      { label: "80-89%", min: 80, color: "#6366f1" },
      { label: "70-79%", min: 70, color: "#f59e0b" },
      { label: "60-69%", min: 60, color: "#f97316" },
      { label: "Below 60%", min: 0, color: "#ef4444" },
    ];
    const assignmentMap = new Map(assignments.map((a) => [a.id, a]));
    return bins.map((bin) => ({
      ...bin,
      value: gradedList.filter((s) => {
        const a = assignmentMap.get(s.assignmentId);
        if (!a) return false;
        return ((s.marks ?? 0) / a.maxMarks) * 100 >= bin.min;
      }).length,
    }));
  }, [gradedList, assignments]);

  // Per-assignment with student details
  const perAssignment = useMemo(() => {
    return assignments
      .map((a) => {
        const subs = submissions.filter((s) => s.assignmentId === a.id);
        const g = subs.filter((s) => s.status === "Graded");
        const avg = g.length > 0
          ? (g.reduce((sum, s) => sum + (s.marks ?? 0), 0) / g.length).toFixed(1)
          : null;
        return { assignment: a, allSubs: subs, gradedCount: g.length, avg };
      })
      .sort((a, b) => b.allSubs.length - a.allSubs.length);
  }, [assignments, submissions]);

  const pieSegments = [
    { label: "Submitted", value: submitted, color: "#f59e0b" },
    { label: "Graded", value: graded, color: "#10b981" },
    { label: "Returned", value: returned, color: "#6366f1" },
  ];

  return (
    <AuthGuard roles={["Teacher"]}>
      <PageHero
        title="Performance"
        subtitle="Student performance analytics across all your assignments."
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton rows={8} />
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-6 w-6" />}
          title="No data yet"
          description="Create assignments and receive submissions to see performance analytics."
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

          {/* Charts row */}
          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            {/* Pie chart */}
            <Card>
              <CardHeader title="Status distribution" subtitle="Submission status breakdown" action={<TrendingUp className="h-4 w-4 text-slate-400" />} />
              <CardBody>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                  <PieChart segments={pieSegments} size={130} />
                  <div className="space-y-1.5 text-xs">
                    {pieSegments.map((s) => (
                      <div key={s.label} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-slate-600">{s.label}</span>
                        <span className="ml-auto font-semibold text-slate-900">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Grade distribution */}
            <Card>
              <CardHeader title="Grade distribution" subtitle={`${graded} graded submissions`} action={<BarChart3 className="h-4 w-4 text-slate-400" />} />
              <CardBody>
                {graded === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-500">No graded submissions yet.</p>
                ) : (
                  <div>
                    {gradeDistribution.map((bin) => {
                      const pct = graded > 0 ? Math.round((bin.value / graded) * 100) : 0;
                      return (
                        <HorizontalBar
                          key={bin.label}
                          pct={pct}
                          color={bin.color}
                          label={bin.label}
                          sub={`${bin.value} (${pct}%)`}
                        />
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Overview */}
            <Card>
              <CardHeader title="Overview" subtitle="Grading progress" action={<CheckCircle2 className="h-4 w-4 text-slate-400" />} />
              <CardBody>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-bold text-slate-900">{gradeRate}%</span>
                  <span className="text-sm text-slate-500">{pending} pending</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: `${gradeRate}%` }} />
                </div>
                <div className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Total submissions</span><span className="font-semibold text-slate-900">{totalSubs}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Graded</span><span className="font-semibold text-emerald-600">{graded}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Pending</span><span className="font-semibold text-amber-600">{pending}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Average marks</span><span className="font-semibold text-slate-900">{avgMarks ?? "—"}</span></div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Per-assignment breakdown */}
          <Card>
            <CardHeader title="Per-assignment performance" subtitle="Student-wise marks and submission status" action={<GraduationCap className="h-4 w-4 text-slate-400" />} />
            <CardBody className="p-0">
              <div className="divide-y divide-slate-100">
                {perAssignment.map(({ assignment, allSubs, gradedCount, avg }) => {
                  const subPct = assignment.maxMarks > 0 && avg ? Math.round((Number(avg) / assignment.maxMarks) * 100) : 0;
                  return (
                    <details key={assignment.id} className="group">
                      <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 marker:content-none hover:bg-slate-50/60">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">{assignment.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {assignment.subjectName} · {assignment.className} · {assignment.maxMarks} marks
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-slate-500">{allSubs.length} subs</span>
                          <span className="text-slate-500">{gradedCount} graded</span>
                          {avg && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              subPct >= 80 ? "bg-emerald-100 text-emerald-700" :
                              subPct >= 60 ? "bg-amber-100 text-amber-700" :
                              "bg-rose-100 text-rose-700"
                            }`}>
                              {avg} avg
                            </span>
                          )}
                          <span className="text-xs text-slate-300 group-open:rotate-90 transition-transform">▶</span>
                        </div>
                      </summary>
                      <div className="border-t border-slate-50 bg-slate-50/30">
                        {allSubs.length === 0 ? (
                          <p className="px-5 py-4 text-sm text-slate-400">No submissions yet.</p>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {allSubs.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map((s) => {
                              const markPct = assignment.maxMarks > 0 && s.marks != null
                                ? Math.round((s.marks / assignment.maxMarks) * 100) : null;
                              return (
                                <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 bg-white">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-900">{s.studentName}</p>
                                    <p className="text-xs text-slate-500">{formatDateShort(s.submittedAt)}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {s.marks != null ? (
                                      <span className={`text-sm font-semibold ${
                                        markPct && markPct >= 80 ? "text-emerald-600" :
                                        markPct && markPct >= 60 ? "text-amber-600" :
                                        "text-rose-600"
                                      }`}>
                                        {s.marks}/{assignment.maxMarks}
                                        {markPct && <span className="ml-1 text-xs">({markPct}%)</span>}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-slate-400">—/{assignment.maxMarks}</span>
                                    )}
                                    <SubmissionStatusBadge status={s.status} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </AuthGuard>
  );
}
