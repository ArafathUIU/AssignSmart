"use client";

import Link from "next/link";
import { CheckCircle, Clock, FilePlus2, Inbox, Sparkles } from "lucide-react";
import type { Assignment, Submission, TeacherAssignment } from "@/lib/types";
import { DashboardHero } from "./DashboardHero";
import { AssignmentCalendar, type CalendarItem } from "@/components/ui/AssignmentCalendar";
import { SubjectCard, type SubjectEntry } from "./SubjectCard";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
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
        label: closed ? "Deadline passed" : `${a.submissionCount} submission${a.submissionCount === 1 ? "" : "s"}`,
        href: `/teacher/assignments/${a.id}`,
      };
    });

  const bySubject = new Map<string, Assignment[]>();
  for (const a of assignments) {
    const list = bySubject.get(a.subjectId) ?? [];
    list.push(a);
    bySubject.set(a.subjectId, list);
  }
  const subjectEntries: SubjectEntry[] = [...bySubject.entries()].map(
    ([subjectId, list]) => ({
      subjectId,
      subjectName: list[0].subjectName,
      assignments: list,
    }),
  );

  return (
    <>
      <DashboardHero
        name={name}
        role="Teacher"
        subtitle={`You teach ${teaching.length} class·subject combination${teaching.length === 1 ? "" : "s"}. Create assignments, review submissions and grade them.`}
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <AssignmentCalendar items={calendarItems} />
        </div>

        <div className="space-y-6">
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

          <Card>
            <CardHeader
              title="My teaching"
              subtitle="Your class·subject combinations — drill into each"
              action={
                <Link href="/teacher/assignments" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  Manage
                </Link>
              }
            />
            <CardBody>
              {loading ? (
                <Skeleton rows={3} />
              ) : subjectEntries.length === 0 ? (
                <EmptyState
                  title="No assignments yet"
                  description="Create your first assignment to get started."
                />
              ) : (
                <div className="space-y-3">
                  {subjectEntries.map((entry) => (
                    <SubjectCard key={entry.subjectId} entry={entry} hrefPrefix="/teacher/assignments" />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
