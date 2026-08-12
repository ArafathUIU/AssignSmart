"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Inbox,
  MessageSquare,
  Pencil,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { PageHero } from "@/components/ui/PageHero";
import { api } from "@/lib/api";
import type { Submission, TeacherAssignment } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAsyncData } from "@/lib/useAsyncData";
import { formatDateShort } from "@/lib/utils";

export default function TeacherSubmissionsPage() {
  const { success, error: notifyError } = useToast();
  const { data, loading, refresh } = useAsyncData(async () => {
    const [submissions, teaching] = await Promise.all([
      api.get<Submission[]>("/api/submissions"),
      api.get<TeacherAssignment[]>("/api/teacher-assignments/me"),
    ]);
    return { submissions, teaching };
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [downloading, setDownloading] = useState(false);

  const submissions = useMemo(() => data?.submissions ?? [], [data]);
  const teaching = useMemo(() => data?.teaching ?? [], [data]);

  const total = submissions.length;
  const pending = submissions.filter(
    (s) => s.status === "Submitted" || s.status === "Returned",
  );
  const graded = submissions.filter((s) => s.status === "Graded");

  // Group teaching by classId
  const classGroups = useMemo(() => {
    const map = new Map<string, {
      classId: string;
      className: string;
      studentCount: number;
      subjects: string[];
    }>();
    for (const t of teaching) {
      const entry = map.get(t.classId) ?? {
        classId: t.classId,
        className: t.className,
        studentCount: 0,
        subjects: [],
      };
      if (!entry.subjects.includes(t.subjectName)) {
        entry.subjects.push(t.subjectName);
      }
      map.set(t.classId, entry);
    }
    return [...map.values()];
  }, [teaching]);

  // Get submissions for a class
  const getClassSubmissions = (classId: string) => {
    return submissions.filter((s) => {
      return s.assignmentId && true; // We need assignment data too
    });
  };

  // All submissions filtered
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return submissions.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (query) {
        return (
          s.studentName.toLowerCase().includes(query) ||
          s.assignmentTitle.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [submissions, search, statusFilter]);

  async function handleQuickGrade(submissionId: string) {
    if (!gradeMarks) return;
    try {
      await api.put(`/api/submissions/${submissionId}/grade`, {
        marks: Number(gradeMarks),
        feedback: gradeFeedback || null,
      });
      success("Graded successfully.");
      setGradingId(null);
      setGradeMarks("");
      setGradeFeedback("");
      await refresh();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Grading failed.");
    }
  }

  function openGrade(s: Submission) {
    setGradingId(s.id);
    setGradeMarks(s.marks !== null ? String(s.marks) : "");
    setGradeFeedback(s.feedback ?? "");
  }

  async function handleDownloadAll(submissions: Submission[], className: string) {
    setDownloading(true);
    try {
      for (const sub of submissions) {
        if (sub.attachments.length === 0) continue;
        const files = await api.get<Array<{
          fileName: string;
          contentType: string;
          fileSize: number;
          fileData: string;
        }>>(`/api/submissions/${sub.id}/attachments`);

        for (const file of files) {
          const safeClass = className.replace(/\s+/g, "_");
          const safeName = sub.studentName.replace(/\s+/g, "_");
          const downloadName = `${sub.studentId.slice(0, 8)}_${safeName}_${safeClass}_${file.fileName}`;
          const byteChars = atob(file.fileData);
          const bytes = new Uint8Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            bytes[i] = byteChars.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: file.contentType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = downloadName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          await new Promise((r) => setTimeout(r, 300));
        }
      }
      if (submissions.some((s) => s.attachments.length > 0)) {
        success("All files downloaded.");
      } else {
        notifyError("No files to download.");
      }
    } catch (err) {
      notifyError("Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AuthGuard roles={["Teacher"]}>
      <PageHero
        title="Submissions"
        subtitle={`${total} submissions · ${pending.length} pending review`}
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton rows={8} />
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="No submissions yet"
          description="Students haven't submitted to your assignments yet."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total" value={total} icon={<Inbox className="h-5 w-5" />} tone="brand" />
            <StatCard label="Pending review" value={pending.length} icon={<Sparkles className="h-5 w-5" />} tone="amber" />
            <StatCard label="Graded" value={graded.length} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
            <StatCard label="Classes" value={classGroups.length} icon={<GraduationCap className="h-5 w-5" />} tone="slate" />
          </div>

          {/* Pending review queue */}
          {pending.length > 0 && (
            <Card className="mb-6 border-amber-200 bg-amber-50/40">
              <CardHeader
                title={`Pending review — ${pending.length} submission${pending.length === 1 ? "" : "s"} waiting`}
                subtitle="These need your attention first"
                action={<Sparkles className="h-4 w-4 text-amber-500" />}
              />
              <CardBody>
                <div className="space-y-2">
                  {pending.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{s.studentName}</p>
                        <p className="text-xs text-slate-500">{s.assignmentTitle} · {formatDateShort(s.submittedAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <SubmissionStatusBadge status={s.status} />
                        {gradingId === s.id ? (
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" step="0.5" value={gradeMarks} onChange={(e) => setGradeMarks(e.target.value)} placeholder="Marks" className="h-8 w-20 rounded-lg border border-slate-200 px-2 text-sm" />
                            <button onClick={() => handleQuickGrade(s.id)} className="rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-600">Grade</button>
                            <button onClick={() => setGradingId(null)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button onClick={() => openGrade(s)} className="rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50">Quick grade</button>
                            <Link href={`/teacher/assignments/${s.assignmentId}`}>
                              <Button size="xs" variant="ghost"><ExternalLink className="h-3.5 w-3.5" /></Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {pending.length > 5 && <p className="text-center text-xs text-amber-600">+{pending.length - 5} more pending</p>}
                </div>
              </CardBody>
            </Card>
          )}

          {/* My Classes — submission overview */}
          <div className="mb-6">
            <Card>
              <CardHeader title="My Classes" subtitle="View submissions by classroom" action={<GraduationCap className="h-4 w-4 text-slate-400" />} />
              <CardBody>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {classGroups.map((cg) => (
                    <button
                      key={cg.classId}
                      onClick={() => setSelectedClassId(selectedClassId === cg.classId ? null : cg.classId)}
                      className={`rounded-2xl border p-5 text-left transition-all ${
                        selectedClassId === cg.classId
                          ? "border-brand-300 bg-brand-50/40 shadow-[0_4px_12px_rgb(0_0_0/0.06)]"
                          : "border-slate-200 bg-white shadow-[0_1px_3px_rgb(0_0_0/0.04)] hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{cg.className}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{cg.subjects.length} subjects</p>
                        </div>
                        <Users className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-xs">
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                          {pending.length} pending
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
                          {graded.length} graded
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Submissions list */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student or assignment..." className="pl-9" />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
              <option value="">All statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Graded">Graded</option>
              <option value="Returned">Returned</option>
            </Select>
            {filtered.some((s) => s.attachments.length > 0) && (
              <Button size="sm" variant="outline" loading={downloading} onClick={() => handleDownloadAll(filtered, "All_Classes")}>
                <Download className="h-4 w-4" /> Download all files
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {filtered.map((s) => (
              <Card key={s.id} className="transition-all hover:border-slate-300">
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{s.studentName}</p>
                    <p className="text-xs text-slate-500">{s.assignmentTitle} · {formatDateShort(s.submittedAt)}</p>
                    {s.answer && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{s.answer}</p>
                    )}
                    {s.marks !== null && <p className="mt-1 text-xs font-semibold text-emerald-600">{s.marks} marks</p>}
                    {s.feedback && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <MessageSquare className="h-3 w-3" />{s.feedback}
                      </p>
                    )}
                    {s.attachments.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                        <FileText className="h-3 w-3" />
                        {s.attachments.length} file{s.attachments.length === 1 ? "" : "s"} attached
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <SubmissionStatusBadge status={s.status} />
                    {gradingId === s.id ? (
                      <div className="flex items-center gap-1.5">
                        <input type="number" min="0" step="0.5" value={gradeMarks} onChange={(e) => setGradeMarks(e.target.value)} placeholder="Marks" className="h-7 w-16 rounded-lg border border-slate-200 px-2 text-xs" />
                        <input value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} placeholder="Feedback..." className="h-7 w-28 rounded-lg border border-slate-200 px-2 text-xs" />
                        <button onClick={() => handleQuickGrade(s.id)} className="rounded-lg bg-slate-900 p-1.5 text-white hover:bg-slate-800"><Send className="h-3 w-3" /></button>
                        <button onClick={() => setGradingId(null)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); openGrade(s); }} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700">
                        <Pencil className="mr-1 inline h-3 w-3" />Grade
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </AuthGuard>
  );
}
