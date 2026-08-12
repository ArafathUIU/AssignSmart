"use client";

import { useAsyncData } from "@/lib/useAsyncData";
import { api } from "@/lib/api";
import type { Assignment, SchoolClass, Subject, Submission, User } from "@/lib/types";
import AuthGuard from "@/components/AuthGuard";
import { PageHero } from "@/components/ui/PageHero";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export default function AdminSettingsPage() {
  const { data: users, loading: usersLoading } = useAsyncData(() => api.get<User[]>("/api/users"));
  const { data: classes, loading: classesLoading } = useAsyncData(() => api.get<SchoolClass[]>("/api/classes"));
  const { data: subjects, loading: subjectsLoading } = useAsyncData(() => api.get<Subject[]>("/api/subjects"));
  const { data: assignments, loading: assignmentsLoading } = useAsyncData(() => api.get<Assignment[]>("/api/assignments"));
  const { data: submissions, loading: submissionsLoading } = useAsyncData(() => api.get<Submission[]>("/api/submissions"));

  const loading = usersLoading || classesLoading || subjectsLoading || assignmentsLoading || submissionsLoading;

  const roleCounts = {
    Admin: users?.filter((u) => u.role === "Admin").length ?? 0,
    Teacher: users?.filter((u) => u.role === "Teacher").length ?? 0,
    Student: users?.filter((u) => u.role === "Student").length ?? 0,
  };

  const publishedCount = assignments?.filter((a) => a.isPublished).length ?? 0;
  const draftCount = (assignments?.length ?? 0) - publishedCount;
  const gradedCount = submissions?.filter((s) => s.status === "Graded").length ?? 0;
  const pendingCount = submissions?.filter((s) => s.status !== "Graded").length ?? 0;

  return (
    <AuthGuard roles={["Admin"]}>
      <PageHero
        title="Settings"
        subtitle="Application overview and system configuration."
      />

      {loading ? (
        <div className="space-y-4">
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
            <StatCard label="Total users" value={users?.length ?? 0} icon={<Users className="h-5 w-5" />} tone="brand" />
            <StatCard label="Classes" value={classes?.length ?? 0} icon={<GraduationCap className="h-5 w-5" />} tone="amber" />
            <StatCard label="Subjects" value={subjects?.length ?? 0} icon={<BookOpen className="h-5 w-5" />} tone="green" />
            <StatCard label="Assignments" value={assignments?.length ?? 0} icon={<LayoutDashboard className="h-5 w-5" />} tone="slate" />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Published" value={publishedCount} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
            <StatCard label="Drafts" value={draftCount} icon={<Sparkles className="h-5 w-5" />} tone="slate" />
            <StatCard label="Graded" value={gradedCount} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
            <StatCard label="Pending review" value={pendingCount} icon={<Inbox className="h-5 w-5" />} tone="amber" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader title="Institution" subtitle="Academic entities configured in the system." action={<BookOpen className="h-4 w-4 text-slate-400" />} />
              <CardBody>
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Classes</dt>
                    <dd className="font-semibold text-slate-900">{classes?.length ?? 0}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Subjects</dt>
                    <dd className="font-semibold text-slate-900">{subjects?.length ?? 0}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Assignments</dt>
                    <dd className="font-semibold text-slate-900">{assignments?.length ?? 0}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Submissions</dt>
                    <dd className="font-semibold text-slate-900">{submissions?.length ?? 0}</dd>
                  </div>
                </dl>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Accounts by role" subtitle="Breakdown of user roles." action={<ShieldCheck className="h-4 w-4 text-slate-400" />} />
              <CardBody>
                <div className="space-y-3">
                  {(Object.entries(roleCounts) as Array<[keyof typeof roleCounts, number]>).map(
                    ([role, count]) => {
                      const total = users?.length ?? 1;
                      const pct = Math.round((count / total) * 100);
                      const colors = {
                        Admin: { bar: "bg-gradient-to-r from-brand-400 to-brand-500", badge: "brand" as const },
                        Teacher: { bar: "bg-gradient-to-r from-amber-400 to-amber-500", badge: "amber" as const },
                        Student: { bar: "bg-gradient-to-r from-emerald-400 to-emerald-500", badge: "green" as const },
                      };
                      const c = colors[role];
                      return (
                        <div key={role}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Badge tone={c.badge}>{role}</Badge>
                              <span className="text-slate-600">{count}</span>
                            </div>
                            <span className="text-xs text-slate-400">{pct}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </CardBody>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader title="Workflow rules" subtitle="Business rules enforced by the backend." action={<ShieldCheck className="h-4 w-4 text-slate-400" />} />
              <CardBody>
                <ul className="grid gap-x-8 gap-y-2 text-sm text-slate-600 md:grid-cols-2">
                  <li>• Students can only see published assignments for their own class.</li>
                  <li>• Submissions are locked once the deadline has passed.</li>
                  <li>• Students may update their answer before the deadline.</li>
                  <li>• Marks may not exceed the assignment&apos;s maximum marks.</li>
                  <li>• Only the owning teacher can grade or change submission status.</li>
                  <li>• Submissions are marked with a Submitted / Graded / Returned workflow.</li>
                  <li>• Graded submissions cannot be modified by the student.</li>
                  <li>• File uploads are validated against teacher-allowed formats.</li>
                  <li>• Questions can be asked per assignment — only the assignment teacher can answer.</li>
                  <li>• Role-based sidebar navigation adapts per user type.</li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </AuthGuard>
  );
}
