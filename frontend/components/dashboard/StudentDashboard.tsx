"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Inbox,
  MessageSquare,
  Sparkles,
  Star,
} from "lucide-react";
import type { Assignment, Submission, TeacherAssignment } from "@/lib/types";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/useAsyncData";
import { DashboardHero } from "./DashboardHero";
import { SubjectTile } from "./SubjectTile";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { isPast, formatDateShort } from "@/lib/utils";

function numericId(guid: string): string {
  let hash = 0;
  for (let i = 0; i < guid.length; i++) {
    hash = ((hash << 5) - hash + guid.charCodeAt(i)) | 0;
  }
  return String(Math.abs(hash) % 100000).padStart(5, "0");
}

export function StudentDashboard({
  name,
  className,
  userId,
  assignments,
  submissions,
  loading,
}: {
  name: string;
  className: string | null;
  userId: string;
  assignments: Assignment[];
  submissions: Submission[];
  loading: boolean;
}) {
  const { data: attended, loading: attendedLoading } = useAsyncData(() =>
    api.get<TeacherAssignment[]>("/api/teacher-assignments/my-class"),
  );

  const submissionByAssignment = new Map(
    submissions.map((s) => [s.assignmentId, s]),
  );
  const available = assignments.filter(
    (a) => !submissionByAssignment.has(a.id) && !isPast(a.deadline),
  ).length;
  const submitted = submissions.length;
  const pending = submissions.filter(
    (s) => s.status === "Submitted" || s.status === "Returned",
  ).length;
  const graded = submissions.filter((s) => s.status === "Graded").length;

  const upcoming = assignments
    .filter((a) => !submissionByAssignment.has(a.id) && !isPast(a.deadline))
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 4);

  const recentGrades = submissions
    .filter((s) => s.status === "Graded")
    .sort((a, b) => (b.gradedAt ?? b.submittedAt).localeCompare(a.gradedAt ?? a.submittedAt))
    .slice(0, 4);

  const averageMarks =
    recentGrades.length > 0
      ? (recentGrades.reduce((sum, s) => sum + (s.marks ?? 0), 0) / recentGrades.length).toFixed(1)
      : null;

  const subjects = new Map<
    string,
    { subjectId: string; subjectName: string; teacherName: string; assignments: Assignment[] }
  >();
  for (const t of attended ?? []) {
    subjects.set(t.subjectId, {
      subjectId: t.subjectId,
      subjectName: t.subjectName,
      teacherName: t.teacherName,
      assignments: [],
    });
  }
  for (const a of assignments) {
    const existing = subjects.get(a.subjectId);
    if (existing) {
      existing.assignments.push(a);
    } else {
      subjects.set(a.subjectId, {
        subjectId: a.subjectId,
        subjectName: a.subjectName,
        teacherName: a.teacherName,
        assignments: [a],
      });
    }
  }
  const subjectTiles = [...subjects.values()].map(({ subjectId, subjectName, teacherName, assignments: list }) => {
    const gradedCount = list.filter((a) => {
      const s = submissionByAssignment.get(a.id);
      return s?.status === "Graded";
    }).length;
    return {
      subjectId,
      subjectName,
      teacherName,
      assignmentCount: list.length,
      gradedCount,
    };
  });

  return (
    <>
      <DashboardHero
        name={name}
        role="Student"
        subtitle={
          className
            ? `${className} · Student ID: ${numericId(userId)}`
            : `Student ID: ${numericId(userId)}`
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Available" value={available} icon={<BookOpen className="h-5 w-5" />} tone="brand" />
          <StatCard label="Submitted" value={submitted} icon={<Inbox className="h-5 w-5" />} tone="amber" />
          <StatCard label="Pending review" value={pending} icon={<Sparkles className="h-5 w-5" />} tone="slate" />
          <StatCard label="Graded" value={graded} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
        </div>
      )}

      {/* Subjects */}
      <div className="mt-6">
        <Card>
          <CardHeader
            title="My subjects"
            subtitle="Subjects taught in your class — click to explore assignments and results."
            action={<BookOpen className="h-4 w-4 text-slate-400" />}
          />
          <CardBody>
            {loading || attendedLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-36" />
                ))}
              </div>
            ) : subjectTiles.length === 0 ? (
              <EmptyState
                icon={<GraduationCap className="h-6 w-6" />}
                title="No subjects yet"
                description="Subjects taught in your class will appear here once your teachers are assigned."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subjectTiles.map((tile) => (
                  <SubjectTile
                    key={tile.subjectId}
                    subjectId={tile.subjectId}
                    subjectName={tile.subjectName}
                    teacherName={tile.teacherName}
                    assignmentCount={tile.assignmentCount}
                    gradedCount={tile.gradedCount}
                  />
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader
            title="Upcoming deadlines"
            subtitle="Assignments due soon"
            action={<Clock className="h-4 w-4 text-slate-400" />}
          />
          <CardBody className="p-0">
            {upcoming.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<CheckCircle2 className="h-6 w-6" />}
                  title="All caught up"
                  description="No pending deadlines — great work!"
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcoming.map((a) => (
                  <Link
                    key={a.id}
                    href={`/student/assignments/${a.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {a.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {a.subjectName} · Due {formatDateShort(a.deadline)}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader
            title="Recent grades"
            subtitle={
              averageMarks
                ? `Average: ${averageMarks} marks`
                : "Your graded assignments"
            }
            action={<Star className="h-4 w-4 text-slate-400" />}
          />
          <CardBody className="p-0">
            {recentGrades.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<Star className="h-6 w-6" />}
                  title="No grades yet"
                  description="Your graded work will appear here once reviewed."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentGrades.map((s) => {
                  const a = assignments.find((x) => x.id === s.assignmentId);
                  return (
                    <Link
                      key={s.id}
                      href={`/student/assignments/${s.assignmentId}`}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {s.assignmentTitle}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-emerald-600">
                            {s.marks}/{a?.maxMarks ?? "—"}
                          </span>
                          {s.feedback && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {s.feedback.length > 40
                                ? s.feedback.slice(0, 40) + "…"
                                : s.feedback}
                            </span>
                          )}
                        </div>
                      </div>
                      <SubmissionStatusBadge status={s.status} />
                    </Link>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick links */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/student/assignments">
          <Button variant="outline" size="sm">
            <BookOpen className="h-4 w-4" /> Browse assignments
          </Button>
        </Link>
        <Link href="/student/submissions">
          <Button variant="outline" size="sm">
            <Inbox className="h-4 w-4" /> View submissions
          </Button>
        </Link>
        <Link href="/student/calendar">
          <Button variant="outline" size="sm">
            <Clock className="h-4 w-4" /> Calendar
          </Button>
        </Link>
      </div>
    </>
  );
}
