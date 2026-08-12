"use client";

import { useMemo } from "react";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Inbox,
  Sparkles,
  Users,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { PageHero } from "@/components/ui/PageHero";
import { api } from "@/lib/api";
import type { Assignment, SchoolClass, Submission, User } from "@/lib/types";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/lib/useAsyncData";

export default function AdminPerformancePage() {
  const { data, loading } = useAsyncData(async () => {
    const [users, classes, assignments, submissions] = await Promise.all([
      api.get<User[]>("/api/users"),
      api.get<SchoolClass[]>("/api/classes"),
      api.get<Assignment[]>("/api/assignments"),
      api.get<Submission[]>("/api/submissions"),
    ]);
    return { users, classes, assignments, submissions };
  });

  const users = useMemo(() => data?.users ?? [], [data]);
  const classes = useMemo(() => data?.classes ?? [], [data]);
  const assignments = useMemo(() => data?.assignments ?? [], [data]);
  const submissions = useMemo(() => data?.submissions ?? [], [data]);

  const totalUsers = users.length;
  const teacherCount = users.filter((u) => u.role === "Teacher").length;
  const studentCount = users.filter((u) => u.role === "Student").length;
  const totalClasses = classes.length;
  const published = assignments.filter((a) => a.isPublished).length;
  const graded = submissions.filter((s) => s.status === "Graded").length;
  const pending = submissions.filter((s) => s.status !== "Graded").length;

  return (
    <AuthGuard roles={["Admin"]}>
      <PageHero
        title="Performance"
        subtitle="Institution-wide overview of users, assignments and submissions."
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton rows={6} />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total users" value={totalUsers} icon={<Users className="h-5 w-5" />} tone="brand" />
            <StatCard label="Teachers" value={teacherCount} icon={<GraduationCap className="h-5 w-5" />} tone="amber" />
            <StatCard label="Students" value={studentCount} icon={<Users className="h-5 w-5" />} tone="green" />
            <StatCard label="Classes" value={totalClasses} icon={<BookOpen className="h-5 w-5" />} tone="slate" />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Assignments" value={assignments.length} icon={<ClipboardList className="h-5 w-5" />} tone="brand" />
            <StatCard label="Published" value={published} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
            <StatCard label="Submissions" value={submissions.length} icon={<Inbox className="h-5 w-5" />} tone="amber" />
            <StatCard label="Pending review" value={pending} icon={<Sparkles className="h-5 w-5" />} tone="rose" />
          </div>

          <Card>
            <CardHeader title="Institution summary" subtitle="Overview of activity across the platform" action={<BarChart3 className="h-4 w-4 text-slate-400" />} />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-brand-50 p-4 text-center">
                  <p className="text-3xl font-bold text-brand-700">{published}</p>
                  <p className="mt-1 text-xs text-brand-600">Published assignments</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-700">{graded}</p>
                  <p className="mt-1 text-xs text-emerald-600">Graded submissions</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4 text-center">
                  <p className="text-3xl font-bold text-amber-700">{pending}</p>
                  <p className="mt-1 text-xs text-amber-600">Pending review</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </AuthGuard>
  );
}
