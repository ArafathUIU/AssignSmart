"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Star,
  TrendingUp,
  Trophy,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { PageHero } from "@/components/ui/PageHero";
import { api } from "@/lib/api";
import type { Assignment, Submission } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/lib/useAsyncData";
import { formatDateShort } from "@/lib/utils";

export default function StudentGradesPage() {
  const { data, loading } = useAsyncData(async () => {
    const [a, s] = await Promise.all([
      api.get<Assignment[]>("/api/assignments"),
      api.get<Submission[]>("/api/submissions"),
    ]);
    return { assignments: a, submissions: s };
  });

  const [subjectFilter, setSubjectFilter] = useState("");

  const assignments = useMemo(() => data?.assignments ?? [], [data]);
  const submissions = useMemo(() => data?.submissions ?? [], [data]);

  const graded = useMemo(
    () => submissions.filter((s) => s.status === "Graded"),
    [submissions],
  );

  const assignmentMap = useMemo(
    () => new Map(assignments.map((a) => [a.id, a])),
    [assignments],
  );

  const totalMarks = graded.reduce((sum, s) => sum + (s.marks ?? 0), 0);
  const maxTotal = graded.reduce((sum, s) => {
    return sum + (assignmentMap.get(s.assignmentId)?.maxMarks ?? 0);
  }, 0);
  const averagePercent =
    graded.length > 0 && maxTotal > 0
      ? Math.round((totalMarks / maxTotal) * 100)
      : 0;

  const highest = graded.length > 0
    ? Math.max(...graded.map((s) => s.marks ?? 0))
    : 0;

  const subjectBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { subjectName: string; totalMarks: number; maxTotal: number; count: number; grades: Submission[] }
    >();
    for (const s of graded) {
      const a = assignmentMap.get(s.assignmentId);
      const key = a?.subjectId ?? s.assignmentId;
      const entry = map.get(key) ?? {
        subjectName: a?.subjectName ?? "Unknown",
        totalMarks: 0,
        maxTotal: 0,
        count: 0,
        grades: [],
      };
      entry.totalMarks += s.marks ?? 0;
      entry.maxTotal += a?.maxMarks ?? 0;
      entry.count++;
      entry.grades.push(s);
      map.set(key, entry);
    }
    return [...map.entries()];
  }, [graded, assignmentMap]);

  const allSubjects = useMemo(
    () => [...new Set(assignments.map((a) => a.subjectName))].sort(),
    [assignments],
  );

  const filtered = useMemo(() => {
    if (!subjectFilter) return graded;
    return graded.filter((s) => {
      const a = assignmentMap.get(s.assignmentId);
      return a?.subjectName === subjectFilter;
    });
  }, [graded, assignmentMap, subjectFilter]);

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          (b.gradedAt ?? b.submittedAt).localeCompare(
            a.gradedAt ?? a.submittedAt,
          ),
      ),
    [filtered],
  );

  return (
    <AuthGuard roles={["Student"]}>
      <PageHero
        title="Grades"
        subtitle="Your graded assignments — marks, feedback and subject-wise performance."
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
      ) : graded.length === 0 ? (
        <EmptyState
          icon={<Star className="h-6 w-6" />}
          title="No grades yet"
          description="Your graded work will appear here once reviewed by your teachers."
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
              label="Graded"
              value={graded.length}
              icon={<CheckCircle2 className="h-5 w-5" />}
              tone="green"
            />
            <StatCard
              label="Average"
              value={`${averagePercent}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="brand"
            />
            <StatCard
              label="Highest"
              value={highest}
              icon={<Trophy className="h-5 w-5" />}
              tone="amber"
            />
            <StatCard
              label="Total marks"
              value={`${totalMarks}/${maxTotal}`}
              icon={<BarChart3 className="h-5 w-5" />}
              tone="slate"
            />
          </div>

          {/* Subject breakdown */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjectBreakdown.map(
              ([id, { subjectName, totalMarks, maxTotal, count }]) => {
                const pct =
                  maxTotal > 0
                    ? Math.round((totalMarks / maxTotal) * 100)
                    : 0;
                return (
                  <Card key={id}>
                    <CardHeader
                      title={subjectName}
                      subtitle={`${count} graded`}
                      action={<BookOpen className="h-4 w-4 text-slate-400" />}
                    />
                    <CardBody>
                      <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold text-slate-900">
                          {pct}%
                        </span>
                        <span className="text-xs text-slate-500">
                          {totalMarks}/{maxTotal} marks
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 80
                              ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                              : pct >= 60
                                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                : "bg-gradient-to-r from-rose-400 to-rose-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </CardBody>
                  </Card>
                );
              },
            )}
          </div>

          {/* Filter */}
          <div className="mb-4">
            <Select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-48 text-sm"
            >
              <option value="">All subjects</option>
              {allSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </Select>
          </div>

          {/* Grade list */}
          <div className="space-y-3">
            {sorted.map((s) => {
              const a = assignmentMap.get(s.assignmentId);
              const pct = a
                ? Math.round(((s.marks ?? 0) / a.maxMarks) * 100)
                : 0;
              return (
                <Card
                  key={s.id}
                  className="transition-all hover:border-slate-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {s.assignmentTitle}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            pct >= 80
                              ? "bg-emerald-50 text-emerald-700"
                              : pct >= 60
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span>{a?.subjectName ?? ""}</span>
                        <span className="font-semibold text-emerald-600">
                          {s.marks}/{a?.maxMarks ?? 0} marks
                        </span>
                        <span>
                          Graded {formatDateShort(s.gradedAt ?? s.submittedAt)}
                        </span>
                      </div>
                      {s.feedback && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                          {s.feedback}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <SubmissionStatusBadge status={s.status} />
                      <Link href={`/student/assignments/${s.assignmentId}`}>
                        <Button size="xs" variant="outline">
                          <ExternalLink className="h-3.5 w-3.5" /> View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </AuthGuard>
  );
}
