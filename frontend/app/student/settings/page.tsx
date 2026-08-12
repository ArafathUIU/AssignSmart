"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  BellOff,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Mail,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { PageHero } from "@/components/ui/PageHero";
import { api, getStoredUser } from "@/lib/api";
import type { Assignment, Submission, User } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { useAsyncData } from "@/lib/useAsyncData";

function numericId(guid: string): string {
  let hash = 0;
  for (let i = 0; i < guid.length; i++) {
    hash = ((hash << 5) - hash + guid.charCodeAt(i)) | 0;
  }
  return String(Math.abs(hash) % 100000).padStart(5, "0");
}

export default function StudentSettingsPage() {
  const [user] = useState<User | null>(() => getStoredUser());

  const { data, loading } = useAsyncData(async () => {
    const [assignments, submissions] = await Promise.all([
      api.get<Assignment[]>("/api/assignments"),
      api.get<Submission[]>("/api/submissions"),
    ]);
    return { assignments, submissions };
  });

  const assignments = data?.assignments ?? [];
  const submissions = data?.submissions ?? [];

  const graded = submissions.filter((s) => s.status === "Graded");
  const totalMarks = graded.reduce((sum, s) => sum + (s.marks ?? 0), 0);
  const maxTotal = graded.reduce((sum, s) => {
    const a = assignments.find((x) => x.id === s.assignmentId);
    return sum + (a?.maxMarks ?? 0);
  }, 0);
  const overallPercent =
    graded.length > 0 && maxTotal > 0
      ? Math.round((totalMarks / maxTotal) * 100)
      : null;

  const [bellEnabled, setBellEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("calendar_notify") !== "false";
  });

  useEffect(() => {
    localStorage.setItem("calendar_notify", String(bellEnabled));
  }, [bellEnabled]);

  const allSubjects = [...new Set(assignments.map((a) => a.subjectName))].sort();

  return (
    <AuthGuard roles={["Student"]}>
      <PageHero
        title="Settings"
        subtitle="Your profile, preferences, and academic overview."
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile */}
          <Card>
            <CardHeader
              title="Profile"
              subtitle="Your personal and academic information"
              action={<UserIcon className="h-4 w-4 text-slate-400" />}
            />
            <CardBody>
              <div className="flex items-center gap-4">
                <Avatar
                  name={user?.name ?? "Student"}
                  className="h-16 w-16 text-xl"
                />
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {user?.name ?? "Student"}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    {user?.email ?? ""}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge tone="green">Student</Badge>
                    {user?.className && (
                      <span className="text-xs text-slate-500">
                        {user.className}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Student ID</span>
                  <span className="font-semibold text-slate-900">
                    {numericId(user?.id ?? "")}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Class</span>
                  <span className="font-medium text-slate-900">
                    {user?.className ?? "Not assigned"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Subjects enrolled</span>
                  <span className="font-medium text-slate-900">
                    {allSubjects.length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Overall score</span>
                  <span
                    className={`font-semibold ${
                      overallPercent !== null && overallPercent >= 80
                        ? "text-emerald-600"
                        : overallPercent !== null && overallPercent >= 60
                          ? "text-amber-600"
                          : "text-slate-900"
                    }`}
                  >
                    {overallPercent !== null ? `${overallPercent}%` : "—"}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Academic Overview */}
          <Card>
            <CardHeader
              title="Academic Overview"
              subtitle="Your performance summary"
              action={<GraduationCap className="h-4 w-4 text-slate-400" />}
            />
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-brand-50 p-4 text-center">
                  <p className="text-3xl font-bold text-brand-700">
                    {assignments.length}
                  </p>
                  <p className="mt-1 text-xs text-brand-600">Assignments</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-700">
                    {submissions.length}
                  </p>
                  <p className="mt-1 text-xs text-emerald-600">Submitted</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4 text-center">
                  <p className="text-3xl font-bold text-amber-700">
                    {submissions.filter((s) => s.status !== "Graded").length}
                  </p>
                  <p className="mt-1 text-xs text-amber-600">Pending</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-4 text-center">
                  <p className="text-3xl font-bold text-rose-700">
                    {graded.length}
                  </p>
                  <p className="mt-1 text-xs text-rose-600">Graded</p>
                </div>
              </div>

              {allSubjects.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Enrolled subjects
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {allSubjects.map((sub) => (
                      <span
                        key={sub}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        <BookOpen className="mr-1 inline h-3 w-3" />
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader
              title="Preferences"
              subtitle="Notification and display settings"
              action={<Sparkles className="h-4 w-4 text-slate-400" />}
            />
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    {bellEnabled ? (
                      <Bell className="h-5 w-5 text-amber-500" />
                    ) : (
                      <BellOff className="h-5 w-5 text-slate-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Deadline reminders
                      </p>
                      <p className="text-xs text-slate-500">
                        {bellEnabled
                          ? "Countdown alerts for upcoming deadlines"
                          : "Reminders are currently paused"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setBellEnabled((v) => !v)}
                    className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                      bellEnabled ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        bellEnabled ? "translate-x-[19px]" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader
              title="Account"
              subtitle="Login and role information"
              action={<ShieldCheck className="h-4 w-4 text-slate-400" />}
            />
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Role</span>
                  <Badge tone="green">Student</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium text-slate-900 truncate max-w-[180px]">
                    {user?.email ?? ""}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Assignments completed</span>
                  <span className="flex items-center gap-1 font-medium text-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {graded.length} / {assignments.length}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </AuthGuard>
  );
}
