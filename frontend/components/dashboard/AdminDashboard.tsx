"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Inbox,
  UserCog,
  Users,
} from "lucide-react";
import type { Assignment, SchoolClass, Submission, User } from "@/lib/types";
import { DashboardHero } from "./DashboardHero";
import { AssignmentCalendar, type CalendarItem } from "@/components/ui/AssignmentCalendar";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { AssignmentStatusBadge, SubmissionStatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableEmpty, Td, Th } from "@/components/ui/Table";
import { formatDate, isPast } from "@/lib/utils";

function ProgressBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function AdminDashboard({
  name,
  assignments,
  submissions,
  users,
  classes,
  loading,
}: {
  name: string;
  assignments: Assignment[];
  submissions: Submission[];
  users: User[];
  classes: SchoolClass[];
  loading: boolean;
}) {
  const teachers = users.filter((u) => u.role === "Teacher").length;
  const students = users.filter((u) => u.role === "Student").length;
  const graded = submissions.filter((s) => s.status === "Graded").length;

  const calendarItems: CalendarItem[] = assignments.map((a) => ({
    id: a.id,
    title: a.title,
    date: a.deadline,
    tone: (isPast(a.deadline) ? "rose" : a.isPublished ? "brand" : "slate") as CalendarItem["tone"],
    label: a.isPublished ? a.className : "Draft",
    href: `/admin/assignments`,
  }));

  const recentAssignments = [...assignments]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const recentSubmissions = [...submissions]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 5);

  const quickLinks = [
    { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" />, tone: "from-brand-500 to-indigo-600" },
    { href: "/admin/classes", label: "Classes", icon: <GraduationCap className="h-4 w-4" />, tone: "from-sky-500 to-blue-600" },
    { href: "/admin/subjects", label: "Subjects", icon: <BookOpen className="h-4 w-4" />, tone: "from-emerald-500 to-teal-600" },
    { href: "/admin/teacher-assignments", label: "Teacher assignments", icon: <UserCog className="h-4 w-4" />, tone: "from-amber-500 to-orange-600" },
    { href: "/admin/assignments", label: "Assignments", icon: <ClipboardList className="h-4 w-4" />, tone: "from-rose-500 to-pink-600" },
    { href: "/admin/submissions", label: "Submissions", icon: <Inbox className="h-4 w-4" />, tone: "from-violet-500 to-purple-600" },
  ];

  return (
    <>
      <DashboardHero
        name={name}
        role="Admin"
        subtitle="Manage your institution's users, classes, subjects and assignments from one place."
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Users" value={users.length} icon={<Users className="h-5 w-5" />} tone="brand" />
          <StatCard label="Classes" value={classes.length} icon={<GraduationCap className="h-5 w-5" />} tone="slate" />
          <StatCard label="Assignments" value={assignments.length} icon={<ClipboardList className="h-5 w-5" />} tone="green" />
          <StatCard label="Submissions" value={submissions.length} icon={<Inbox className="h-5 w-5" />} tone="amber" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Quick links" subtitle="Jump to a management screen" />
            <CardBody>
              <div className="grid grid-cols-2 gap-3">
                {quickLinks.map((q) => (
                  <Link
                    key={q.href}
                    href={q.href}
                    className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200/70 bg-slate-50/40 p-3 transition-all duration-150 hover:border-slate-300 hover:bg-white hover:shadow-[var(--shadow-card)]"
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white ${q.tone}`}>
                      {q.icon}
                    </span>
                    <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">
                      {q.label}
                    </span>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Institution health" subtitle="Activity across the school" />
            <CardBody>
              <div className="space-y-4">
                <ProgressBar label="Students enrolled" value={students} max={users.length || 1} tone="from-emerald-500 to-teal-600" />
                <ProgressBar label="Teachers on staff" value={teachers} max={users.length || 1} tone="from-sky-500 to-indigo-600" />
                <ProgressBar label="Assignments published" value={assignments.filter((a) => a.isPublished).length} max={assignments.length || 1} tone="from-brand-500 to-violet-600" />
                <ProgressBar label="Submissions graded" value={graded} max={submissions.length || 1} tone="from-amber-500 to-orange-600" />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <AssignmentCalendar items={calendarItems} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent assignments"
            subtitle="Latest activity across the institution"
            action={
              <Link href="/admin/assignments" className="flex items-center gap-0.5 text-sm font-medium text-brand-600 hover:text-brand-700">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardBody className="px-0 py-0">
            {loading ? (
              <div className="p-5"><Skeleton rows={5} /></div>
            ) : recentAssignments.length === 0 ? (
              <div className="p-5">
                <TableEmpty title="No assignments yet" description="Assignments created by teachers will appear here." />
              </div>
            ) : (
              <Table
                headers={<><Th>Title</Th><Th>Class</Th><Th>Status</Th><Th>Deadline</Th></>}
                empty={null}
              >
                {recentAssignments.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-slate-50">
                    <Td className="font-medium text-slate-900">{a.title}</Td>
                    <Td>{a.className}</Td>
                    <Td><AssignmentStatusBadge published={a.isPublished} /></Td>
                    <Td>{formatDate(a.deadline)}</Td>
                  </tr>
                ))}
              </Table>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent submissions"
            subtitle="Latest student submissions"
            action={
              <Link href="/admin/submissions" className="flex items-center gap-0.5 text-sm font-medium text-brand-600 hover:text-brand-700">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardBody className="px-0 py-0">
            {loading ? (
              <div className="p-5"><Skeleton rows={5} /></div>
            ) : recentSubmissions.length === 0 ? (
              <div className="p-5">
                <TableEmpty title="No submissions yet" description="Student submissions will appear here." />
              </div>
            ) : (
              <Table
                headers={<><Th>Student</Th><Th>Assignment</Th><Th>Status</Th></>}
                empty={null}
              >
                {recentSubmissions.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-slate-50">
                    <Td className="font-medium text-slate-900">{s.studentName}</Td>
                    <Td>{s.assignmentTitle}</Td>
                    <Td><SubmissionStatusBadge status={s.status} /></Td>
                  </tr>
                ))}
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
