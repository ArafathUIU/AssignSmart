"use client";

import { useEffect, useState, use } from "react";
import {
  CalendarClock,
  BookOpen,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  Inbox,
  MessageSquare,
  Pencil,
  Reply,
  ScanSearch,
  Send,
  AlertTriangle,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { api } from "@/lib/api";
import type { Assignment, AssignmentQuestion, Submission } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { PageHero } from "@/components/ui/PageHero";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { AssignmentStatusBadge, SubmissionStatusBadge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatDateShort } from "@/lib/utils";

const statuses = ["Submitted", "Graded", "Returned"] as const;

export default function TeacherAssignmentDetailPage(
  props: PageProps<"/teacher/assignments/[id]">,
) {
  const { success, error: notifyError } = useToast();
  const { id } = use(props.params);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [updating, setUpdating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [gradeMarks, setGradeMarks] = useState<Record<string, string>>({});
  const [gradeFeedback, setGradeFeedback] = useState<Record<string, string>>({});
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [postingAnswerId, setPostingAnswerId] = useState<string | null>(null);

  const [similarityResults, setSimilarityResults] = useState<{
    results: { submissionAId: string; studentAName: string; submissionBId: string; studentBName: string; similarity: number; answerPreview: string }[];
    totalComparisons: number;
    flaggedCount: number;
    threshold: number;
  } | null>(null);
  const [checkingSimilarity, setCheckingSimilarity] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [data, subs] = await Promise.all([
          api.get<Assignment>(`/api/assignments/${id}`),
          api.get<Submission[]>(`/api/assignments/${id}/submissions`),
        ]);
        if (cancelled) return;
        setAssignment(data);
        setSubmissions(subs);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setDeadline(new Date(data.deadline).toISOString().slice(0, 16));
        setMaxMarks(String(data.maxMarks));
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

  async function reloadSubmissions() {
    setSubmissions(
      await api.get<Submission[]>(`/api/assignments/${id}/submissions`),
    );
  }

  async function handleUpdate() {
    if (!assignment) return;
    setUpdating(true);
    try {
      const updated = await api.put<Assignment>(`/api/assignments/${id}`, {
        title,
        description: description || null,
        deadline: new Date(deadline).toISOString(),
        maxMarks: Number(maxMarks),
      });
      setAssignment(updated);
      success("Assignment updated.");
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleTogglePublish() {
    if (!assignment) return;
    setPublishing(true);
    try {
      const updated = await api.patch<Assignment>(
        `/api/assignments/${id}/publish`,
        { isPublished: !assignment.isPublished },
      );
      setAssignment(updated);
      success(updated.isPublished ? "Assignment published." : "Assignment set to draft.");
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleGrade(submissionId: string) {
    setGradingId(submissionId);
    try {
      await api.put(`/api/submissions/${submissionId}/grade`, {
        marks: Number(gradeMarks[submissionId]),
        feedback: gradeFeedback[submissionId] || null,
      });
      success("Submission graded.");
      await reloadSubmissions();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Grading failed.");
    } finally {
      setGradingId(null);
    }
  }

  async function handleChangeStatus(submissionId: string, status: string) {
    setStatusUpdatingId(submissionId);
    try {
      await api.patch(`/api/submissions/${submissionId}/status`, { status });
      success("Status updated.");
      await reloadSubmissions();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Status update failed.");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleAnswer(questionId: string) {
    const answer = answers[questionId]?.trim();
    if (!answer) return;
    setPostingAnswerId(questionId);
    try {
      await api.post(`/api/assignments/questions/${questionId}/answers`, { answer });
      success("Answer posted.");
      setAnswers((prev) => ({ ...prev, [questionId]: "" }));
      const updated = await api.get<AssignmentQuestion[]>(`/api/assignments/${id}/questions`);
      setQuestions(updated);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Failed to post.");
    } finally {
      setPostingAnswerId(null);
    }
  }

  async function handleCheckSimilarity() {
    setCheckingSimilarity(true);
    try {
      const result = await api.post<any>(
        `/api/assignments/${id}/check-similarity?threshold=0.6`,
        {},
      );
      setSimilarityResults(result);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Similarity check failed.");
    } finally {
      setCheckingSimilarity(false);
    }
  }

  return (
    <AuthGuard roles={["Teacher"]}>
      {loading ? (
        <div className="space-y-4">
          <Skeleton rows={2} className="h-8" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton rows={6} />
            <Skeleton rows={8} />
          </div>
        </div>
      ) : !assignment ? (
        <Alert tone="error" title="Unable to load">{error ?? "Assignment not found."}</Alert>
      ) : (
        <>
          <PageHero
            title={assignment.title}
            subtitle={`${assignment.className} · ${assignment.subjectName} · ${assignment.teacherName}`}
            action={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCheckSimilarity}
                  loading={checkingSimilarity}
                >
                  <ScanSearch className="h-4 w-4" /> Check similarity
                </Button>
                <Button
                  variant={assignment.isPublished ? "secondary" : "primary"}
                  onClick={handleTogglePublish}
                  loading={publishing}
                >
                  {assignment.isPublished ? "Set to draft" : "Publish"}
                </Button>
              </div>
            }
          />

          {error && (
            <Alert tone="error" className="mb-4" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {similarityResults && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Similarity Check Results
                  </p>
                  <p className="text-xs text-slate-500">
                    {similarityResults.totalComparisons} comparisons · Threshold: {Math.round(similarityResults.threshold * 100)}%
                  </p>
                </div>
                {similarityResults.flaggedCount === 0 ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    No copies found
                  </span>
                ) : (
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                    {similarityResults.flaggedCount} flagged
                  </span>
                )}
              </div>
              {similarityResults.flaggedCount > 0 && (
                <div className="space-y-3">
                  {similarityResults.results.map((r, i) => (
                    <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-amber-800">
                          <AlertTriangle className="mr-1.5 inline h-4 w-4" />
                          {r.similarity}% similar
                        </p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          r.similarity >= 85 ? "bg-rose-100 text-rose-700" :
                          r.similarity >= 75 ? "bg-amber-100 text-amber-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {r.similarity >= 85 ? "High" : r.similarity >= 75 ? "Medium" : "Low"}
                        </span>
                      </div>
                      <p className="text-sm text-amber-700">
                        <strong>{r.studentAName}</strong> ↔ <strong>{r.studentBName}</strong>
                      </p>
                      <div className="mt-2 rounded-lg bg-white p-3 text-xs text-slate-600">
                        <p className="mb-1 font-semibold text-slate-400 uppercase tracking-wide">Answer preview</p>
                        {r.answerPreview}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mb-6 flex flex-wrap gap-x-6 gap-y-3 rounded-xl border border-slate-200/80 bg-white px-5 py-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <CalendarClock className="h-4 w-4" />
              </span>
              Deadline: <span className="font-medium text-slate-900">{formatDate(assignment.deadline)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <BookOpen className="h-4 w-4" />
              </span>
              Subject: <span className="font-medium text-slate-900">{assignment.subjectName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <GraduationCap className="h-4 w-4" />
              </span>
              Class: <span className="font-medium text-slate-900">{assignment.className}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <ClipboardList className="h-4 w-4" />
              </span>
              Max marks: <span className="font-medium text-slate-900">{assignment.maxMarks}</span>
            </div>
            <AssignmentStatusBadge published={assignment.isPublished} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="h-fit">
              <CardHeader
                title="Edit assignment"
                subtitle="Updates apply immediately."
                action={<Pencil className="h-4 w-4 text-slate-400" />}
              />
              <CardBody>
                <div className="space-y-4">
                  <Field label="Title" htmlFor="e-title" required>
                    <Input
                      id="e-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </Field>
                  <Field label="Description" htmlFor="e-description">
                    <Textarea
                      id="e-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Deadline" htmlFor="e-deadline" required>
                      <Input
                        id="e-deadline"
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                      />
                    </Field>
                    <Field label="Max marks" htmlFor="e-marks" required>
                      <Input
                        id="e-marks"
                        type="number"
                        min="1"
                        step="0.5"
                        value={maxMarks}
                        onChange={(e) => setMaxMarks(e.target.value)}
                      />
                    </Field>
                  </div>
                  <Button className="w-full" onClick={handleUpdate} loading={updating}>
                    Save changes
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title={`Submissions (${submissions.length})`}
                subtitle="Review answers, assign marks and provide feedback."
                action={<Inbox className="h-4 w-4 text-slate-400" />}
              />
              <CardBody>
                {submissions.length === 0 ? (
                  <EmptyState
                    icon={<Inbox className="h-6 w-6" />}
                    title="No submissions yet"
                    description="Students haven't submitted this assignment."
                  />
                ) : (
                  <div className="space-y-5">
                    {submissions.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-slate-200/80 bg-gradient-to-b from-slate-50/40 to-transparent p-4 transition-all duration-150 hover:border-slate-300"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <Avatar name={s.studentName} />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{s.studentName}</p>
                              <p className="text-xs text-slate-500">
                                Submitted {formatDate(s.submittedAt)}
                              </p>
                            </div>
                          </div>
                          <SubmissionStatusBadge status={s.status} />
                        </div>

                        <div className="mb-3 rounded-lg bg-slate-50 p-3">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Student answer
                          </p>
                          <p className="whitespace-pre-wrap text-sm text-slate-700">{s.answer}</p>
                        </div>

                        {s.marks !== null && (
                          <div className="mb-3 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-3 text-sm">
                            <p className="text-emerald-800">
                              Marks: <strong>{s.marks}</strong> / {assignment.maxMarks}
                            </p>
                            {s.feedback && (
                              <p className="mt-1 text-emerald-700">Feedback: {s.feedback}</p>
                            )}
                          </div>
                        )}

                        <div className="mt-3 grid gap-3 sm:grid-cols-[7rem_1fr_auto]">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">
                              Marks
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              max={assignment.maxMarks}
                              value={gradeMarks[s.id] ?? ""}
                              onChange={(e) =>
                                setGradeMarks((prev) => ({ ...prev, [s.id]: e.target.value }))
                              }
                              placeholder={`/ ${assignment.maxMarks}`}
                              aria-label={`Marks for ${s.studentName}`}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">
                              Feedback
                            </label>
                            <Input
                              value={gradeFeedback[s.id] ?? ""}
                              onChange={(e) =>
                                setGradeFeedback((prev) => ({ ...prev, [s.id]: e.target.value }))
                              }
                              placeholder="Add feedback for the student..."
                              aria-label={`Feedback for ${s.studentName}`}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              size="sm"
                              onClick={() => handleGrade(s.id)}
                              loading={gradingId === s.id}
                              disabled={!gradeMarks[s.id]}
                            >
                              <Send className="h-3.5 w-3.5" /> Grade
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-500">Status:</span>
                          {statuses.map((status) => (
                            <button
                              key={status}
                              onClick={() => handleChangeStatus(s.id, status)}
                              disabled={statusUpdatingId === s.id}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                                s.status === status
                                  ? "bg-brand-600 text-white"
                                  : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader
                title="Student Questions"
                subtitle={
                  questions.length > 0
                    ? `${questions.length} question${questions.length === 1 ? "" : "s"} from students`
                    : "No questions yet"
                }
                action={<HelpCircle className="h-4 w-4 text-slate-400" />}
              />
              <CardBody>
                {questionsLoading ? (
                  <Skeleton rows={3} />
                ) : questions.length === 0 ? (
                  <EmptyState
                    icon={<MessageSquare className="h-5 w-5" />}
                    title="No questions"
                    description="Students haven't asked any questions yet."
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
                        {q.answers.length > 0 && (
                          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                            {q.answers.map((a) => (
                              <div key={a.id} className="rounded-lg bg-brand-50/60 px-3 py-2">
                                <div className="mb-1 flex items-center gap-2">
                                  <span className="text-xs font-semibold text-brand-700">
                                    {a.teacherName}
                                  </span>
                                  <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                                    You
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
                        <div className="mt-3 flex gap-2">
                          <input
                            value={answers[q.id] ?? ""}
                            onChange={(e) =>
                              setAnswers((prev) => ({
                                ...prev,
                                [q.id]: e.target.value,
                              }))
                            }
                            placeholder="Write your answer..."
                            className="h-9 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/15 placeholder:text-slate-400 focus:border-brand-400 focus:ring-[3px]"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAnswer(q.id)}
                            loading={postingAnswerId === q.id}
                            disabled={!answers[q.id]?.trim()}
                          >
                            <Reply className="h-4 w-4" /> Reply
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </AuthGuard>
  );
}
