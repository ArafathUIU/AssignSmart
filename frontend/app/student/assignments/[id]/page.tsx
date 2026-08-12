"use client";

import { useEffect, useState, use, useRef } from "react";
import {
  BookOpen,
  CalendarClock,
  FileText,
  GraduationCap,
  HelpCircle,
  MessageSquare,
  Paperclip,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { PageHero } from "@/components/ui/PageHero";
import { api } from "@/lib/api";
import type { Assignment, Submission, AssignmentQuestion } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatDateShort, isPast } from "@/lib/utils";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function StudentAssignmentDetailPage(
  props: PageProps<"/student/assignments/[id]">,
) {
  const { success, error: notifyError } = useToast();
  const { id } = use(props.params);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [answer, setAnswer] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [replacingFiles, setReplacingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Q&A state
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [postingQuestion, setPostingQuestion] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.get<Assignment>(`/api/assignments/${id}`);
        const subs = await api.get<Submission[]>("/api/submissions");
        const own = subs.find((s) => s.assignmentId === id);
        if (cancelled) return;
        setAssignment(data);
        if (own) {
          setSubmission(own);
          setAnswer(own.answer);
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
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    setQuestionsLoading(true);
    api
      .get<AssignmentQuestion[]>(`/api/assignments/${id}/questions`)
      .then(setQuestions)
      .catch(() => {})
      .finally(() => setQuestionsLoading(false));
  }, [id]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    if (assignment?.allowedFileTypes) {
      const allowed = assignment.allowedFileTypes
        .split(",")
        .map((f) => f.trim().toLowerCase());
      for (const file of selected) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!allowed.includes(ext) && !allowed.includes(file.type)) {
          notifyError(
            `"${file.name}" is not allowed. Allowed: ${assignment.allowedFileTypes}`,
          );
          return;
        }
      }
    }

    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
    setReplacingFiles(false);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!assignment) return;
    const hasContent = answer.trim() || files.length > 0;
    if (!hasContent) return;

    setSubmitting(true);
    try {
      const attachments =
        files.length > 0
          ? await Promise.all(
              files.map(async (f) => ({
                fileName: f.name,
                contentType: f.type || "application/octet-stream",
                fileSize: f.size,
                fileData: await fileToBase64(f),
              })),
            )
          : undefined;

      if (submission) {
        const updated = await api.put<Submission>(
          `/api/submissions/${submission.id}`,
          { answer: answer.trim() || null, attachments },
        );
        setSubmission(updated);
        setFiles([]);
        setReplacingFiles(false);
        success("Submission updated.");
      } else {
        const created = await api.post<Submission>("/api/submissions", {
          assignmentId: assignment.id,
          answer: answer.trim() || null,
          attachments,
        });
        setSubmission(created);
        setFiles([]);
        success("Submission accepted.");
      }
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePostQuestion() {
    if (!newQuestion.trim()) return;
    setPostingQuestion(true);
    try {
      const q = await api.post<AssignmentQuestion>(
        `/api/assignments/${id}/questions`,
        { question: newQuestion.trim() },
      );
      setQuestions((prev) => [q, ...prev]);
      setNewQuestion("");
      success("Question posted.");
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Failed to post.");
    } finally {
      setPostingQuestion(false);
    }
  }

  const deadlinePassed = assignment ? isPast(assignment.deadline) : false;
  const canEdit = !deadlinePassed && (!submission || submission.status !== "Graded");

  return (
    <AuthGuard roles={["Student"]}>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton rows={8} />
        </div>
      ) : !assignment ? (
        <Alert tone="error" title="Unable to load">{error ?? "Assignment not found."}</Alert>
      ) : (
        <>
          <PageHero
            title={assignment.title}
            subtitle={`${assignment.className} · ${assignment.subjectName} · ${assignment.teacherName}`}
          />

          {error && (
            <Alert tone="error" className="mb-4" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-[var(--shadow-card)]">
              <CalendarClock className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Deadline</p>
                <p className={`text-sm font-medium ${deadlinePassed ? "text-rose-600" : "text-slate-900"}`}>
                  {formatDate(assignment.deadline)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-[var(--shadow-card)]">
              <BookOpen className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Subject</p>
                <p className="text-sm font-medium text-slate-900">{assignment.subjectName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-[var(--shadow-card)]">
              <GraduationCap className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Teacher · Max marks</p>
                <p className="text-sm font-medium text-slate-900">
                  {assignment.teacherName} · {assignment.maxMarks}
                </p>
              </div>
            </div>
          </div>

          {/* File type hint */}
          {assignment.allowedFileTypes && (
            <div className="mb-6 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-brand-700">
              <span className="font-semibold">Allowed files:</span>{" "}
              {assignment.allowedFileTypes}
            </div>
          )}

          {assignment.description && (
            <Card className="mb-6">
              <CardHeader title="Assignment details" />
              <CardBody>
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {assignment.description}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Existing submission feedback */}
          {submission?.marks !== null && submission?.marks !== undefined && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-emerald-800">
                  <span className="font-semibold">Marks:</span>{" "}
                  <strong className="text-lg">{submission.marks}</strong> / {assignment.maxMarks}
                </p>
                <SubmissionStatusBadge status={submission.status} />
              </div>
              {submission.feedback && (
                <p className="mt-2 text-sm text-emerald-700">
                  <span className="font-semibold">Feedback:</span> {submission.feedback}
                </p>
              )}
            </div>
          )}

          {/* Existing submission attachments */}
          {submission && submission.attachments.length > 0 && (
            <Card className="mb-6">
              <CardHeader
                title="Submission files"
                subtitle={`${submission.attachments.length} file${submission.attachments.length === 1 ? "" : "s"}`}
                action={<Paperclip className="h-4 w-4 text-slate-400" />}
              />
              <CardBody>
                <div className="space-y-2">
                  {submission.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        {att.fileName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {(att.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Submission form */}
          {canEdit && (
            <Card className="mb-6">
              <CardHeader
                title={submission ? "Update your submission" : "Submit your answer"}
                subtitle={
                  submission
                    ? "You can update before the deadline."
                    : `Deadline: ${formatDate(assignment.deadline)}`
                }
              />
              <CardBody>
                <div className="space-y-4">
                  <Field label="Answer" htmlFor="answer">
                    <Textarea
                      id="answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      rows={7}
                      placeholder="Type your answer here..."
                    />
                  </Field>

                  {/* File upload */}
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Attachments</p>

                    {/* Existing files from current submission */}
                    {submission && submission.attachments.length > 0 && !replacingFiles && (
                      <div className="mb-3">
                        <p className="mb-2 text-xs text-slate-500">
                          Current files (submit new ones to replace):
                        </p>
                        <div className="space-y-1">
                          {submission.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center gap-2 text-sm text-slate-600"
                            >
                              <FileText className="h-3.5 w-3.5 text-slate-400" />
                              {att.fileName}
                              <span className="text-xs text-slate-400">
                                ({(att.fileSize / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFiles([]);
                            setReplacingFiles(true);
                          }}
                          className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          Replace files
                        </button>
                      </div>
                    )}

                    {/* File list */}
                    {files.length > 0 && (
                      <div className="mb-3 space-y-1.5">
                        {files.map((file, i) => (
                          <div
                            key={`${file.name}-${i}`}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                          >
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-slate-400" />
                              {file.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              className="rounded p-0.5 text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {files.length > 0 ? "Add more files" : "Attach files"}
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleSubmit}
                      loading={submitting}
                      disabled={!answer.trim() && files.length === 0}
                    >
                      <Send className="h-4 w-4" />
                      {submission ? "Update submission" : "Submit answer"}
                    </Button>
                    {submission && (
                      <span className="text-xs text-slate-500">
                        Submitted {formatDate(submission.submittedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Q&A Section */}
          <Card>
            <CardHeader
              title="Questions & Discussion"
              subtitle={
                questions.length > 0
                  ? `${questions.length} question${questions.length === 1 ? "" : "s"}`
                  : "Ask a question about this assignment"
              }
              action={<HelpCircle className="h-4 w-4 text-slate-400" />}
            />
            <CardBody>
              {/* Ask a question */}
              <div className="mb-4 flex gap-2">
                <input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Ask a question about this assignment..."
                  className="h-10 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/15 placeholder:text-slate-400 focus:border-brand-400 focus:ring-[3px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handlePostQuestion();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handlePostQuestion}
                  loading={postingQuestion}
                  disabled={!newQuestion.trim()}
                >
                  <Send className="h-4 w-4" /> Ask
                </Button>
              </div>

              {/* Questions list */}
              {questionsLoading ? (
                <Skeleton rows={3} />
              ) : questions.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="No questions yet"
                  description="Be the first to ask a question."
                />
              ) : (
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {q.studentName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDateShort(q.createdAt)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700">{q.question}</p>

                      {/* Answers */}
                      {q.answers.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                          {q.answers.map((a) => (
                            <div
                              key={a.id}
                              className="rounded-lg bg-white px-3 py-2"
                            >
                              <div className="mb-1 flex items-center gap-2">
                                <span className="text-xs font-semibold text-brand-600">
                                  {a.teacherName}
                                </span>
                                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-600">
                                  Teacher
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {formatDateShort(a.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700">{a.answer}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </AuthGuard>
  );
}
