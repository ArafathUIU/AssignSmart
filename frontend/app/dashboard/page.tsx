"use client";

import { useState } from "react";
import { api, getStoredUser } from "@/lib/api";
import type {
  Assignment,
  SchoolClass,
  Submission,
  TeacherAssignment,
  User,
} from "@/lib/types";
import AuthGuard from "@/components/AuthGuard";
import { useAsyncData } from "@/lib/useAsyncData";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";

export default function DashboardPage() {
  const [user] = useState<User | null>(() => getStoredUser());

  const { data: assignments, loading: assignmentsLoading } = useAsyncData(() =>
    api.get<Assignment[]>("/api/assignments"),
  );
  const { data: submissions, loading: submissionsLoading } = useAsyncData(() =>
    api.get<Submission[]>("/api/submissions"),
  );
  const { data: adminData } = useAsyncData(async () => {
    if (user?.role !== "Admin") return null;
    const [users, classes] = await Promise.all([
      api.get<User[]>("/api/users"),
      api.get<SchoolClass[]>("/api/classes"),
    ]);
    return { users, classes };
  });
  const { data: teaching } = useAsyncData(async () => {
    if (user?.role !== "Teacher") return null;
    return api.get<TeacherAssignment[]>("/api/teacher-assignments/me");
  });

  const allAssignments = assignments ?? [];
  const allSubmissions = submissions ?? [];
  const loading = assignmentsLoading || submissionsLoading;

  return (
    <AuthGuard>
      {user?.role === "Admin" ? (
        <AdminDashboard
          name={user?.name ?? ""}
          assignments={allAssignments}
          submissions={allSubmissions}
          users={adminData?.users ?? []}
          classes={adminData?.classes ?? []}
          loading={loading}
        />
      ) : user?.role === "Teacher" ? (
        <TeacherDashboard
          name={user?.name ?? ""}
          assignments={allAssignments}
          submissions={allSubmissions}
          teaching={teaching ?? []}
          loading={loading}
        />
      ) : (
        <StudentDashboard
          name={user?.name ?? ""}
          className={user?.className ?? null}
          userId={user?.id ?? ""}
          assignments={allAssignments}
          submissions={allSubmissions}
          loading={loading}
        />
      )}
    </AuthGuard>
  );
}
