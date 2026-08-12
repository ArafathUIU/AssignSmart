"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BookOpen,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { PageHero } from "@/components/ui/PageHero";
import { api } from "@/lib/api";
import type { MarksheetResponse, TeacherAssignment } from "@/lib/types";
import { Select } from "@/components/ui/Field";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAsyncData } from "@/lib/useAsyncData";

export default function TeacherMarksheetPage() {
  const { data: teachingData, loading: teachingLoading } = useAsyncData(() =>
    api.get<TeacherAssignment[]>("/api/teacher-assignments/me"),
  );

  const teaching = useMemo(() => teachingData ?? [], [teachingData]);
  const classOptions = useMemo(
    () => [...new Map(teaching.map((t) => [t.classId, t.className])).entries()],
    [teaching],
  );

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [marksheet, setMarksheet] = useState<MarksheetResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedClassId) {
      setMarksheet(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get<MarksheetResponse>(`/api/assignments/marksheet?classId=${selectedClassId}`)
      .then((data) => { if (!cancelled) setMarksheet(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedClassId]);

  const rows = marksheet?.rows ?? [];
  const assignments = marksheet?.assignments ?? [];

  const studentCount = rows.length;
  const gradedTotal = rows.filter((r) => r.percentage !== null).length;
  const avgPct =
    gradedTotal > 0
      ? (rows.reduce((s, r) => s + (r.percentage ?? 0), 0) / gradedTotal).toFixed(1)
      : null;
  const passCount = rows.filter((r) => (r.percentage ?? 0) >= 60).length;

  return (
    <AuthGuard roles={["Teacher"]}>
      <PageHero
        title="Marksheet"
        subtitle={
          marksheet
            ? `${marksheet.className} - ${assignments.length} assignments, ${studentCount} students`
            : "View marksheet by class and assignment"
        }
      />

      <div className="mb-6">
        <Select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-64"
        >
          <option value="">Select a class...</option>
          {classOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </Select>
      </div>

      {loading || teachingLoading ? (
        <Skeleton rows={10} />
      ) : !selectedClassId ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="Select a class"
          description="Choose a class above to view its marksheet."
        />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-6 w-6" />}
          title="No assignments"
          description="No assignments found for this class."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Students" value={studentCount} icon={<Users className="h-5 w-5" />} tone="brand" />
            <StatCard label="Graded" value={gradedTotal} icon={<GraduationCap className="h-5 w-5" />} tone="green" />
            <StatCard label="Average %" value={avgPct ? `${avgPct}%` : "-"} icon={<TrendingUp className="h-5 w-5" />} tone="amber" />
            <StatCard label="Pass >=60%" value={passCount} icon={<BookOpen className="h-5 w-5" />} tone="slate" />
          </div>

          <Card>
            <CardHeader
              title={marksheet?.className ?? "Marksheet"}
              subtitle={`${assignments.length} assignments - scroll horizontally to see all`}
              action={<BookOpen className="h-4 w-4 text-slate-400" />}
            />
            <CardBody className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student
                    </th>
                    {assignments.map((a) => (
                      <th key={a.id} className="whitespace-nowrap px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <div className="max-w-[100px] truncate" title={a.title}>{a.title}</div>
                        <div className="text-[10px] font-normal text-slate-400">/{a.maxMarks}</div>
                      </th>
                    ))}
                    <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                    <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.studentId} className="transition-colors hover:bg-slate-50/60">
                      <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3 text-xs font-medium text-slate-900">
                        {row.studentName}
                      </td>
                      {row.cells.map((cell) => {
                        const assn = assignments.find((a) => a.id === cell.assignmentId);
                        const pct = assn && cell.marks != null
                          ? Math.round((cell.marks / assn.maxMarks) * 100) : null;
                        return (
                          <td key={cell.assignmentId} className="whitespace-nowrap px-3 py-3 text-center text-xs">
                            {cell.status === "Not submitted" ? (
                              <span className="text-slate-300">-</span>
                            ) : cell.marks != null ? (
                              <span className={`font-semibold ${
                                pct && pct >= 80 ? "text-emerald-600" :
                                pct && pct >= 60 ? "text-amber-600" : "text-rose-600"
                              }`}>{cell.marks}</span>
                            ) : (
                              <span className="text-slate-400">pending</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="whitespace-nowrap px-4 py-3 text-center text-xs">
                        {row.totalMarks != null ? (
                          <span className="font-semibold text-slate-900">
                            {row.totalMarks}/{row.totalMax}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-xs">
                        {row.percentage != null ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            row.percentage >= 80 ? "bg-emerald-100 text-emerald-700" :
                            row.percentage >= 60 ? "bg-amber-100 text-amber-700" :
                            "bg-rose-100 text-rose-700"
                          }`}>{row.percentage}%</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </>
      )}
    </AuthGuard>
  );
}
