"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  User as UserIcon,
  Users,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { PageHero } from "@/components/ui/PageHero";
import { useTheme } from "@/components/ui/ThemeProvider";
import { api, getStoredUser } from "@/lib/api";
import type { Assignment, Submission, TeacherAssignment, User } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/lib/useAsyncData";
import { Avatar } from "@/components/ui/Avatar";

export default function TeacherSettingsPage() {
  const [user] = useState<User | null>(() => getStoredUser());
  const { dark, toggle: toggleTheme } = useTheme();

  const { data, loading } = useAsyncData(async () => {
    const [assignments, submissions, teaching] = await Promise.all([
      api.get<Assignment[]>("/api/assignments"),
      api.get<Submission[]>("/api/submissions"),
      api.get<TeacherAssignment[]>("/api/teacher-assignments/me"),
    ]);
    return { assignments, submissions, teaching };
  });

  const assignments = useMemo(() => data?.assignments ?? [], [data]);
  const submissions = useMemo(() => data?.submissions ?? [], [data]);
  const teaching = useMemo(() => data?.teaching ?? [], [data]);

  const published = assignments.filter((a) => a.isPublished).length;
  const drafts = assignments.length - published;
  const graded = submissions.filter((s) => s.status === "Graded").length;
  const pending = submissions.filter((s) => s.status !== "Graded").length;

  const subjectGroups = useMemo(() => {
    const map = new Map<string, { subjectNames: string[]; classNames: string[]; count: number }>();
    for (const t of teaching) {
      const key = t.subjectId;
      const entry = map.get(key) ?? { subjectNames: [], classNames: [], count: 0 };
      if (!entry.subjectNames.includes(t.subjectName)) entry.subjectNames.push(t.subjectName);
      if (!entry.classNames.includes(t.className)) entry.classNames.push(t.className);
      entry.count = assignments.filter((a) => a.subjectId === t.subjectId).length;
      map.set(key, entry);
    }
    return [...map.entries()];
  }, [teaching, assignments]);

  return (
    <AuthGuard roles={["Teacher"]}>
      <PageHero
        title="Settings"
        subtitle="Your profile, teaching overview, and account information."
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Card */}
          <Card>
            <CardHeader
              title="Profile"
              subtitle="Your personal and account information"
              action={<UserIcon className="h-4 w-4 text-slate-400" />}
            />
            <CardBody>
              <div className="flex items-center gap-4">
                <Avatar name={user?.name ?? "Teacher"} className="h-16 w-16 text-xl" />
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {user?.name ?? "Teacher"}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    {user?.email ?? ""}
                  </p>
                  <div className="mt-2">
                    <Badge tone="amber">Teacher</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-brand-50 p-3 text-center">
                  <p className="text-2xl font-bold text-brand-700">
                    {published}
                  </p>
                  <p className="mt-0.5 text-xs text-brand-600">Published</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-700">{drafts}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Drafts</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{graded}</p>
                  <p className="mt-0.5 text-xs text-emerald-600">Graded</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{pending}</p>
                  <p className="mt-0.5 text-xs text-amber-600">Pending</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Teaching Overview */}
          <Card>
            <CardHeader
              title="Teaching Overview"
              subtitle={`${teaching.length} class-subject assignments`}
              action={<BookOpen className="h-4 w-4 text-slate-400" />}
            />
            <CardBody>
              {subjectGroups.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  No teaching assignments yet. Contact an admin.
                </div>
              ) : (
                <div className="space-y-3">
                  {subjectGroups.map(([id, group]) => {
                    const subjectName = group.subjectNames[0] ?? "Unknown";
                    const subCount = group.count;
                    return (
                      <div
                        key={id}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-brand-600 shadow-[0_1px_3px_rgb(0_0_0/0.04)]">
                              {subjectName.charAt(0)}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {subjectName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {group.classNames.join(", ")}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-slate-400">
                            {subCount} assignments
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Teaching stats */}
          <Card>
            <CardHeader
              title="Quick Stats"
              subtitle="Summary of your teaching activity"
              action={<Sparkles className="h-4 w-4 text-slate-400" />}
            />
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <GraduationCap className="h-4 w-4" />
                    Subjects taught
                  </span>
                  <span className="font-semibold text-slate-900">
                    {subjectGroups.length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <BookOpen className="h-4 w-4" />
                    Total assignments
                  </span>
                  <span className="font-semibold text-slate-900">
                    {assignments.length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Users className="h-4 w-4" />
                    Submissions received
                  </span>
                  <span className="font-semibold text-slate-900">
                    {submissions.length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <ShieldCheck className="h-4 w-4" />
                    Grading progress
                  </span>
                  <span className="font-semibold text-slate-900">
                    {submissions.length > 0
                      ? `${Math.round((graded / submissions.length) * 100)}%`
                      : "—"}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Subjects taught (compact) */}
          <Card>
            <CardHeader
              title="Account"
              subtitle="Login and role information"
              action={<ShieldCheck className="h-4 w-4 text-slate-400" />}
            />
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Account type</span>
                  <Badge tone="amber">Teacher</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium text-slate-900 truncate max-w-[180px]">
                    {user?.email ?? ""}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Classes assigned</span>
                  <span className="font-medium text-slate-900">
                    {new Set(teaching.map((t) => t.className)).size}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Joined</span>
                  <span className="font-medium text-slate-900">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    {dark ? (
                      <Moon className="h-4 w-4 text-indigo-400" />
                    ) : (
                      <Sun className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-slate-500">Dark mode</span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                      dark ? "bg-indigo-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        dark ? "translate-x-[19px]" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </AuthGuard>
  );
}
