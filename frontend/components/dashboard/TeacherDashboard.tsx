"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  BookOpen,
  CheckCircle,
  Clock,
  FilePlus2,
  GraduationCap,
  Inbox,
  Sparkles,
  Users,
} from "lucide-react";
import type { Assignment, Submission, TeacherAssignment } from "@/lib/types";
import { DashboardHero } from "./DashboardHero";
import { AssignmentCalendar, type CalendarItem } from "@/components/ui/AssignmentCalendar";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { formatDate, isPast } from "@/lib/utils";

export function TeacherDashboard({
  name,
  assignments,
  submissions,
  teaching,
  loading,
}: {
  name: string;
  assignments: Assignment[];
  submissions: Submission[];
  teaching: TeacherAssignment[];
  loading: boolean;
}) {
  const published = assignments.filter((a) => a.isPublished).length;
  const drafts = assignments.filter((a) => !a.isPublished).length;
  const pending = submissions.filter(
    (s) => s.status === "Submitted" || s.status === "Returned",
  ).length;
  const graded = submissions.filter((s) => s.status === "Graded").length;

  const pendingList = submissions
    .filter((s) => s.status === "Submitted" || s.status === "Returned")
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 6);

  const calendarItems: CalendarItem[] = assignments
    .filter((a) => a.isPublished)
    .map((a) => {
      const closed = isPast(a.deadline);
      return {
        id: a.id,
        title: a.title,
        date: a.deadline,
        tone: (closed ? "rose" : "brand") as CalendarItem["tone"],
        label: closed
          ? "Deadline passed"
          : `${a.submissionCount} submission${a.submissionCount === 1 ? "" : "s"}`,
        href: `/teacher/assignments/${a.id}`,
      };
    });

  // Group teaching assignments by class
  const classGroups = useMemo(() => {
    const map = new Map<string, {
      classId: string;
      className: string;
      subjects: { subjectId: string; subjectName: string; assignmentCount: number; pendingCount: number }[];
    }>();
    for (const t of teaching) {
      const entry = map.get(t.classId) ?? {
        classId: t.classId,
        className: t.className,
        subjects: [],
      };
      const subAssignments = assignments.filter(
        (a) => a.classId === t.classId && a.subjectId === t.subjectId,
      );
      const subPending = submissions.filter(
        (s) => {
          const a = assignments.find((x) => x.id === s.assignmentId);
          return a?.classId === t.classId && a?.subjectId === t.subjectId &&
            (s.status === "Submitted" || s.status === "Returned");
        },
      );
      entry.subjects.push({
        subjectId: t.subjectId,
        subjectName: t.subjectName,
        assignmentCount: subAssignments.length,
        pendingCount: subPending.length,
      });
      map.set(t.classId, entry);
    }
    return [...map.values()];
  }, [teaching, assignments, submissions]);

  return (
    <>
      <DashboardHero
        name={name}
        role="Teacher"
        subtitle={`You teach ${classGroups.length} class${classGroups.length === 1 ? "" : "es"} across ${new Set(teaching.map((t) => t.subjectId)).size} subject${new Set(teaching.map((t) => t.subjectId)).size === 1 ? "" : "s"}.`}
        action={
          <Link href="/teacher/assignments">
            <Button>
              <FilePlus2 className="h-4 w-4" /> Create assignment
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Assignments" value={assignments.length} icon={<Sparkles className="h-5 w-5" />} tone="brand" />
          <StatCard label="Published" value={published} icon={<CheckCircle className="h-5 w-5" />} tone="green" />
          <StatCard label="Drafts" value={drafts} icon={<Clock className="h-5 w-5" />} tone="slate" />
          <StatCard label="Pending review" value={pending} icon={<Inbox className="h-5 w-5" />} tone="amber" />
          <StatCard label="Graded" value={graded} icon={<CheckCircle className="h-5 w-5" />} tone="green" />
        </div>
      )}

      {/* My Classes */}
      <div className="mt-6">
        <Card>
          <CardHeader
            title="My Classes"
            subtitle="Your assigned classrooms — click to create assignments or view details"
            action={<GraduationCap className="h-4 w-4 text-slate-400" />}
          />
          <CardBody>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            ) : classGroups.length === 0 ? (
              <EmptyState
                icon={<GraduationCap className="h-6 w-6" />}
                title="No classes assigned"
                description="Contact an admin to be assigned to a class."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {classGroups.map((cg) => {
                  const classTotalAssignments = cg.subjects.reduce(
                    (sum, s) => sum + s.assignmentCount, 0,
                  );
                  const classTotalPending = cg.subjects.reduce(
                    (sum, s) => sum + s.pendingCount, 0,
                  );
                  return (
                    <div
                      key={cg.classId}
                      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgb(0_0_0/0.04)] transition-all hover:border-brand-200 hover:shadow-[0_4px_12px_rgb(0_0_0/0.08)]"
                    >
                      {/* Class header */}
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {cg.className}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {cg.subjects.length} subject{cg.subjects.length === 1 ? "" : "s"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {classTotalAssignments} assignments
                            </span>
                          </div>
                        </div>
                        {classTotalPending > 0 && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            {classTotalPending} pending
                          </span>
                        )}
                      </div>

                      {/* Subject list */}
                      <div className="space-y-1.5">
                        {cg.subjects.map((sub) => (
                          <div
                            key={sub.subjectId}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"
                          >
                            <span className="font-medium text-slate-700">
                              {sub.subjectName}
                            </span>
                            <span className="text-slate-400">
                              {sub.assignmentCount} assignment{sub.assignmentCount === 1 ? "" : "s"}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Quick actions */}
                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/teacher/assignments?classId=${cg.classId}`}
                          className="flex-1"
                        >
                          <Button size="xs" variant="primary" className="w-full">
                            <FilePlus2 className="h-3.5 w-3.5" /> Create assignment
                          </Button>
                        </Link>
                        <Link
                          href={`/teacher/submissions?classId=${cg.classId}`}
                          className="flex-1"
                        >
                          <Button size="xs" variant="outline" className="w-full">
                            View submissions
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
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AssignmentCalendar items={calendarItems} />

        <Card>
          <CardHeader
            title="Pending grading"
            subtitle="Newest submissions waiting for your review"
            action={
              <Link href="/teacher/submissions" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          />
          <CardBody>
            {loading ? (
              <Skeleton rows={4} />
            ) : pendingList.length === 0 ? (
              <EmptyState
                icon={<Inbox className="h-6 w-6" />}
                title="All caught up"
                description="No submissions waiting for review."
              />
            ) : (
              <ul className="space-y-2">
                {pendingList.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/teacher/assignments/${s.assignmentId}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/70 bg-slate-50/40 p-3 transition-all duration-150 hover:border-brand-300 hover:bg-brand-50/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {s.studentName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {s.assignmentTitle} · {formatDate(s.submittedAt)}
                        </p>
                      </div>
                      <SubmissionStatusBadge status={s.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
