"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BookOpen,
  FileText,
  GraduationCap,
  MessageSquare,
  Pencil,
  Send,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { PageHero } from "@/components/ui/PageHero";
import { api } from "@/lib/api";
import type { MarksheetResponse, Submission, TeacherAssignment } from "@/lib/types";
import { Select } from "@/components/ui/Field";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useAsyncData } from "@/lib/useAsyncData";

export default function TeacherMarksheetPage() {
  const { success, error: notifyError } = useToast();
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

  // Editing state
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editMarks, setEditMarks] = useState("");
  const [editFeedback, setEditFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  // Submission preview state
  const [previewSub, setPreviewSub] = useState<Submission | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!selectedClassId) { setMarksheet(null); return; }
    let cancelled = false;
    setLoading(true);
    api.get<MarksheetResponse>(`/api/assignments/marksheet?classId=${selectedClassId}`)
      .then((data) => { if (!cancelled) setMarksheet(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedClassId]);

  async function openEdit(cellKey: string, submissionId: string, currentMarks: string, currentFeedback?: string) {
    setEditingKey(cellKey);
    setEditMarks(currentMarks);
    setEditFeedback(currentFeedback ?? "");
    setPreviewSub(null);
    setPreviewLoading(true);
    try {
      const sub = await api.get<Submission>(`/api/submissions/${submissionId}`);
      setPreviewSub(sub);
    } catch {
      setPreviewSub(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSave(submissionId: string) {
    if (!editMarks) return;
    setSaving(true);
    try {
      await api.put(`/api/submissions/${submissionId}/grade`, {
        marks: Number(editMarks),
        feedback: editFeedback || null,
      });
      success("Marks saved.");
      setEditingKey(null);
      setPreviewSub(null);
      // Refresh marksheet data
      if (selectedClassId) {
        const data = await api.get<MarksheetResponse>(`/api/assignments/marksheet?classId=${selectedClassId}`);
        setMarksheet(data);
      }
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const rows = marksheet?.rows ?? [];
  const assignments = marksheet?.assignments ?? [];
  const studentCount = rows.length;
  const gradedTotal = rows.filter((r) => r.percentage !== null).length;
  const avgPct = gradedTotal > 0
    ? (rows.reduce((s, r) => s + (r.percentage ?? 0), 0) / gradedTotal).toFixed(1) : null;
  const passCount = rows.filter((r) => (r.percentage ?? 0) >= 60).length;

  return (
    <AuthGuard roles={["Teacher"]}>
      <PageHero
        title="Marksheet"
        subtitle={marksheet
          ? `${marksheet.className} — ${assignments.length} assignments, ${studentCount} students`
          : "View marksheet by class and assignment"
        }
      />

      <div className="mb-6">
        <Select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-64">
          <option value="">Select a class...</option>
          {classOptions.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </Select>
      </div>

      {loading || teachingLoading ? (
        <Skeleton rows={10} />
      ) : !selectedClassId ? (
        <EmptyState icon={<BookOpen className="h-6 w-6" />} title="Select a class"
          description="Choose a class above to view its marksheet." />
      ) : assignments.length === 0 ? (
        <EmptyState icon={<GraduationCap className="h-6 w-6" />} title="No assignments"
          description="No assignments found for this class." />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Students" value={studentCount} icon={<Users className="h-5 w-5" />} tone="brand" />
            <StatCard label="Graded" value={gradedTotal} icon={<GraduationCap className="h-5 w-5" />} tone="green" />
            <StatCard label="Average %" value={avgPct ? `${avgPct}%` : "—"} icon={<TrendingUp className="h-5 w-5" />} tone="amber" />
            <StatCard label="Pass ≥60%" value={passCount} icon={<BookOpen className="h-5 w-5" />} tone="slate" />
          </div>

          <Card>
            <CardHeader title={marksheet?.className ?? "Marksheet"}
              subtitle={`${assignments.length} assignments — click a cell to grade, see submission on the right`}
              action={<BookOpen className="h-4 w-4 text-slate-400" />}
            />
            <CardBody className="p-0">
              <div className="flex">
                {/* Marksheet table */}
                <div className={`overflow-x-auto ${previewSub ? "w-3/5" : "w-full"} transition-all`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Student</th>
                        {assignments.map((a) => (
                          <th key={a.id} className="whitespace-nowrap px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            <div className="max-w-[80px] truncate" title={a.title}>{a.title}</div>
                            <div className="text-[10px] font-normal text-slate-400">/{a.maxMarks}</div>
                          </th>
                        ))}
                        <th className="whitespace-nowrap px-2 py-3 text-center text-[11px] font-semibold uppercase text-slate-500">Total</th>
                        <th className="whitespace-nowrap px-2 py-3 text-center text-[11px] font-semibold uppercase text-slate-500">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row) => (
                        <tr key={row.studentId} className="transition-colors hover:bg-slate-50/60">
                          <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3 text-xs font-medium text-slate-900">{row.studentName}</td>
                          {row.cells.map((cell) => {
                            const assn = assignments.find((a) => a.id === cell.assignmentId);
                            const pct = assn && cell.marks != null ? Math.round((cell.marks / assn.maxMarks) * 100) : null;
                            const cellKey = `${row.studentId}-${cell.assignmentId}`;
                            const isEditing = editingKey === cellKey;
                            const canEdit = cell.submissionId != null;

                            if (isEditing) {
                              return (
                                <td key={cell.assignmentId} className="whitespace-nowrap px-2 py-2 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      max={assn?.maxMarks}
                                      value={editMarks}
                                      onChange={(e) => setEditMarks(e.target.value)}
                                      className="h-7 w-16 rounded-lg border border-brand-300 px-2 text-center text-xs font-semibold outline-none ring-brand-500/15 focus:border-brand-400 focus:ring-[3px]"
                                      autoFocus
                                    />
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => cell.submissionId && handleSave(cell.submissionId)} disabled={saving}
                                        className="rounded bg-slate-900 p-1 text-white hover:bg-slate-800">
                                        <Send className="h-3 w-3" />
                                      </button>
                                      <button onClick={() => { setEditingKey(null); setPreviewSub(null); }}
                                        className="rounded p-1 text-slate-400 hover:text-slate-600">
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td key={cell.assignmentId} className="whitespace-nowrap px-3 py-3 text-center text-xs">
                                {cell.status === "Not submitted" ? (
                                  <span className="text-slate-300">—</span>
                                ) : cell.marks != null ? (
                                  <button
                                    onClick={() => cell.submissionId && openEdit(cellKey, cell.submissionId, String(cell.marks))}
                                    className={`rounded px-1.5 py-0.5 font-semibold transition-colors hover:bg-slate-100 ${pct && pct >= 80 ? "text-emerald-600" : pct && pct >= 60 ? "text-amber-600" : "text-rose-600"}`}
                                    title="Click to edit marks"
                                  >
                                    {cell.marks}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => cell.submissionId && openEdit(cellKey, cell.submissionId, "0")}
                                    className="rounded px-1.5 py-0.5 text-xs text-brand-600 transition-colors hover:bg-brand-50"
                                    title="Click to grade"
                                  >
                                    <Pencil className="inline h-3 w-3" /> Grade
                                  </button>
                                )}
                              </td>
                            );
                          })}
                          <td className="whitespace-nowrap px-2 py-3 text-center text-xs">
                            {row.totalMarks != null ? <span className="font-semibold text-slate-900">{row.totalMarks}/{row.totalMax}</span> : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="whitespace-nowrap px-2 py-3 text-center text-xs">
                            {row.percentage != null ? (
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.percentage >= 80 ? "bg-emerald-100 text-emerald-700" : row.percentage >= 60 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>{row.percentage}%</span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Submission preview panel */}
                {previewSub && (
                  <div className="w-2/5 shrink-0 border-l border-slate-200 bg-slate-50/30 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{previewSub.studentName}</p>
                      <button onClick={() => setPreviewSub(null)} className="rounded p-1 text-slate-400 hover:text-slate-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mb-2 text-xs text-slate-500">{previewSub.assignmentTitle}</p>

                    {/* Feedback field */}
                    <div className="mb-3">
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Feedback</label>
                      <textarea
                        value={editFeedback}
                        onChange={(e) => setEditFeedback(e.target.value)}
                        rows={2}
                        placeholder="Add feedback for student..."
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none ring-brand-500/15 focus:border-brand-400 focus:ring-[3px]"
                      />
                    </div>

                    {/* Answer */}
                    {previewSub.answer && (
                      <div className="mb-3">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Submitted answer</p>
                        <div className="max-h-40 overflow-y-auto rounded-lg bg-white p-3 text-xs text-slate-700 whitespace-pre-wrap border border-slate-100">
                          {previewSub.answer}
                        </div>
                      </div>
                    )}

                    {/* Attachments */}
                    {previewSub.attachments.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Files ({previewSub.attachments.length})
                        </p>
                        <div className="space-y-1">
                          {previewSub.attachments.map((att) => (
                            <div key={att.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs border border-slate-100">
                              <span className="flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-slate-400" />{att.fileName}
                              </span>
                              <span className="text-slate-400">{(att.fileSize / 1024).toFixed(1)} KB</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {previewSub.marks != null && (
                      <div className="rounded-lg bg-white p-3 border border-slate-100">
                        <p className="text-xs text-slate-500">
                          Current: <strong className="text-slate-900">{previewSub.marks} marks</strong>
                          {previewSub.feedback && (
                            <span className="ml-1.5 flex items-center gap-1 text-slate-400">
                              <MessageSquare className="h-3 w-3" />
                              {previewSub.feedback}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </AuthGuard>
  );
}
