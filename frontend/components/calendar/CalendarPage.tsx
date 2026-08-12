"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlarmClock,
  Bell,
  BellOff,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { api } from "@/lib/api";
import type { Assignment, Role, Submission } from "@/lib/types";
import { AssignmentCalendar, type CalendarItem, type CalendarItemTone } from "@/components/ui/AssignmentCalendar";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { cn, formatDateShort, isPast } from "@/lib/utils";
import { useCountdown } from "./useCountdown";

function getCalendarTone(a: Assignment, submission?: Submission): CalendarItemTone {
  if (submission?.status === "Graded") return "green";
  if (submission) return "amber";
  if (isPast(a.deadline)) return "rose";
  return "brand";
}

function getCalendarLabel(a: Assignment, submission?: Submission): string | undefined {
  if (submission?.status === "Graded") return "Graded";
  if (submission) return "Submitted";
  if (isPast(a.deadline)) return "Overdue";
  return undefined;
}

export default function CalendarPage({ role }: { role: Role }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [notifyEnabled, setNotifyEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("calendar_notify") !== "false";
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (role === "Student") {
          const [all, subs] = await Promise.all([
            api.get<Assignment[]>("/api/assignments"),
            api.get<Submission[]>("/api/submissions"),
          ]);
          if (cancelled) return;
          setAssignments(all.filter((a) => a.isPublished));
          setSubmissions(subs);
        } else if (role === "Teacher") {
          const [all, subs] = await Promise.all([
            api.get<Assignment[]>("/api/assignments"),
            api.get<Submission[]>("/api/submissions"),
          ]);
          if (cancelled) return;
          setAssignments(all);
          setSubmissions(subs);
        } else {
          const [all, subs] = await Promise.all([
            api.get<Assignment[]>("/api/assignments"),
            api.get<Submission[]>("/api/submissions"),
          ]);
          if (cancelled) return;
          setAssignments(all);
          setSubmissions(subs);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [role]);

  function toggleNotify() {
    const next = !notifyEnabled;
    setNotifyEnabled(next);
    localStorage.setItem("calendar_notify", String(next));
  }

  const submissionByAssignment = useMemo(
    () => new Map(submissions.map((s) => [s.assignmentId, s])),
    [submissions],
  );

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const upcoming = useMemo(() => {
    return assignments
      .filter((a) => new Date(a.deadline).getTime() > now)
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
  }, [assignments, now]);

  const nearest = upcoming.length > 0 ? upcoming[0].deadline : null;
  const countdown = useCountdown(nearest);

  const calendarItems: CalendarItem[] = useMemo(
    () =>
      assignments.map((a) => {
        const s = submissionByAssignment.get(a.id);
        return {
          id: a.id,
          title: a.title,
          date: a.deadline,
          tone: getCalendarTone(a, s),
          label: getCalendarLabel(a, s),
        };
      }),
    [assignments, submissionByAssignment],
  );

  const totalAssignments = assignments.length;
  const completedCount = assignments.filter((a) => {
    const s = submissionByAssignment.get(a.id);
    return s?.status === "Graded";
  }).length;
  const pendingCount = assignments.filter((a) => {
    const s = submissionByAssignment.get(a.id);
    return s && s.status !== "Graded";
  }).length;
  const overdueCount = assignments.filter((a) => {
    const s = submissionByAssignment.get(a.id);
    return !s && isPast(a.deadline);
  }).length;

  const recentActivity = useMemo(() => {
    return submissions
      .filter((s) => s.marks !== null || s.status === "Submitted")
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, 5);
  }, [submissions]);

  return (
    <AuthGuard roles={[role]}>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton rows={10} />
        </div>
      ) : error ? (
        <Alert tone="error" title="Unable to load">{error}</Alert>
      ) : (
        <div className="space-y-6">
          {/* Countdown Hero */}
          {nearest && countdown && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white shadow-[0_4px_24px_rgb(0_0_0/0.15)] sm:p-8">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-500/15 blur-[60px]" />
              <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-amber-500/10 blur-[40px]" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <AlarmClock className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-400">
                      Next Deadline
                    </span>
                  </div>
                  <h2 className="text-xl font-bold sm:text-2xl">
                    {upcoming[0].title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {upcoming[0].subjectName} · Due{" "}
                    {new Date(nearest).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(nearest).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  {role === "Student" && (
                    <Link
                      href={`/student/assignments/${upcoming[0].id}`}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-300 hover:text-brand-200"
                    >
                      View assignment <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  {role === "Teacher" && (
                    <Link
                      href={`/teacher/assignments/${upcoming[0].id}`}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-300 hover:text-brand-200"
                    >
                      View assignment <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>

                {/* Countdown digits */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <CountBlock value={countdown.days} label="Days" />
                  <span className="text-2xl font-light text-slate-600">:</span>
                  <CountBlock value={countdown.hours} label="Hrs" />
                  <span className="text-2xl font-light text-slate-600">:</span>
                  <CountBlock value={countdown.minutes} label="Min" />
                  <span className="text-2xl font-light text-slate-600">:</span>
                  <CountBlock value={countdown.seconds} label="Sec" />
                </div>
              </div>

              {/* Bell toggle */}
              <button
                onClick={toggleNotify}
                className={cn(
                  "relative mt-5 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  notifyEnabled
                    ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/20"
                    : "bg-slate-700/50 text-slate-400 hover:bg-slate-700",
                )}
              >
                {notifyEnabled ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
                {notifyEnabled
                  ? "Reminders active"
                  : "Reminders paused"}
              </button>
            </div>
          )}

          {/* No deadline state */}
          {!nearest && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[var(--shadow-card)]">
              <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-3 text-lg font-bold text-slate-900">
                No upcoming deadlines
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                All caught up! No assignments are currently due.
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total assignments"
              value={totalAssignments}
              icon={<CalendarDays className="h-5 w-5" />}
              tone="brand"
            />
            <StatCard
              label="Completed"
              value={completedCount}
              icon={<CheckCircle2 className="h-5 w-5" />}
              tone="green"
            />
            <StatCard
              label="Pending"
              value={pendingCount}
              icon={<Sparkles className="h-5 w-5" />}
              tone="amber"
            />
            <StatCard
              label="Overdue"
              value={overdueCount}
              icon={<Timer className="h-5 w-5" />}
              tone="rose"
            />
          </div>

          {/* Calendar */}
          <AssignmentCalendar items={calendarItems} />

          {/* Upcoming list */}
          <Card>
            <CardHeader
              title="Upcoming deadlines"
              subtitle="All assignments ordered by due date"
              action={<TrendingUp className="h-4 w-4 text-slate-400" />}
            />
            <CardBody className="p-0">
              {upcoming.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<CalendarDays className="h-6 w-6" />}
                    title="Nothing upcoming"
                    description="You have no pending deadlines."
                  />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcoming.map((a) => {
                    const s = submissionByAssignment.get(a.id);
                    const linkHref =
                      role === "Student"
                        ? `/student/assignments/${a.id}`
                        : role === "Teacher"
                          ? `/teacher/assignments/${a.id}`
                          : `/admin/assignments`;
                    return (
                      <div
                        key={a.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50/60"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {a.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                            <span>{a.subjectName}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDateShort(a.deadline)}
                            </span>
                            <TimeRemaining deadline={a.deadline} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {s ? (
                            <SubmissionStatusBadge status={s.status} />
                          ) : (
                            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600 ring-1 ring-inset ring-brand-200">
                              Open
                            </span>
                          )}
                          <Link href={linkHref}>
                            <Button size="xs" variant="outline">
                              View
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

          {/* Activity Tracker */}
          <Card>
            <CardHeader
              title="Recent activity"
              subtitle="Latest submissions and updates"
              action={<TrendingUp className="h-4 w-4 text-slate-400" />}
            />
            <CardBody className="p-0">
              {recentActivity.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<Clock className="h-6 w-6" />}
                    title="No activity yet"
                    description="Recent submissions and updates will appear here."
                  />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentActivity.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        {s.marks !== null ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {s.assignmentTitle}
                        </p>
                        <p className="text-xs text-slate-500">
                          {s.studentName} ·{" "}
                          {s.marks !== null
                            ? `Graded: ${s.marks} marks`
                            : "Submitted"}{" "}
                          · {formatDateShort(s.submittedAt)}
                        </p>
                      </div>
                      <SubmissionStatusBadge status={s.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </AuthGuard>
  );
}

function CountBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-2xl font-bold tabular-nums backdrop-blur-sm sm:h-16 sm:w-16 sm:text-3xl">
        {String(value).padStart(2, "0")}
      </div>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function TimeRemaining({ deadline }: { deadline: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function tick() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setLabel("Now");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      if (days > 0) setLabel(`${days}d ${hours}h`);
      else if (hours > 0) setLabel(`${hours}h ${mins}m`);
      else setLabel(`${mins}m`);
    }
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className="font-medium text-amber-600">{label} left</span>
  );
}
