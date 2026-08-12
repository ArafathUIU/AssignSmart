"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  GraduationCap,
  Search,
  Sparkles,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { api } from "@/lib/api";
import type { Assignment, TeacherAssignment } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/Modal";
import { PageHero } from "@/components/ui/PageHero";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, TableEmpty, Td, Th } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAsyncData } from "@/lib/useAsyncData";
import { formatDate, isPast } from "@/lib/utils";

export default function TeacherAssignmentsPage() {
  const { success, error } = useToast();
  const { data, loading, refresh } = useAsyncData(async () => {
    const [assignmentsData, teachingData] = await Promise.all([
      api.get<Assignment[]>("/api/assignments"),
      api.get<TeacherAssignment[]>("/api/teacher-assignments/me"),
    ]);
    return { assignments: assignmentsData, teaching: teachingData };
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [teacherAssignmentId, setTeacherAssignmentId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [publish, setPublish] = useState(false);
  const [allowedFileTypes, setAllowedFileTypes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function handleTogglePublish(a: Assignment) {
    try {
      await api.patch(`/api/assignments/${a.id}/publish`, {
        isPublished: !a.isPublished,
      });
      success(a.isPublished ? "Set to draft." : "Published.");
      await refresh();
    } catch (err) {
      error(err instanceof Error ? err.message : "Action failed.");
    }
  }

  const assignments = useMemo(() => data?.assignments ?? [], [data]);
  const teaching = data?.teaching ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assignments.filter((a) => {
      if (statusFilter === "published" && !a.isPublished) return false;
      if (statusFilter === "draft" && a.isPublished) return false;
      if (query) {
        return (
          a.title.toLowerCase().includes(query) ||
          a.className.toLowerCase().includes(query) ||
          a.subjectName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [assignments, search, statusFilter]);

  const total = assignments.length;
  const published = assignments.filter((a) => a.isPublished).length;
  const drafts = total - published;

  async function handleCreate() {
    const selected = teaching.find((t) => t.id === teacherAssignmentId);
    if (!selected) {
      error("Please select a class/subject you teach.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/assignments", {
        title,
        description: description || null,
        classId: selected.classId,
        subjectId: selected.subjectId,
        deadline: new Date(deadline).toISOString(),
        maxMarks: Number(maxMarks),
        isPublished: publish,
        allowedFileTypes: allowedFileTypes.trim() || null,
      });
      success(publish ? "Assignment published." : "Draft saved.");
      setTitle("");
      setDescription("");
      setTeacherAssignmentId("");
      setDeadline("");
      setMaxMarks("");
      setPublish(false);
      setAllowedFileTypes("");
      await refresh();
    } catch (err) {
      error(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/assignments/${deleteTarget.id}`);
      success("Assignment deleted.");
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  const canSubmit = title && teacherAssignmentId && deadline && maxMarks;

  return (
    <AuthGuard roles={["Teacher"]}>
      <PageHero
        title="My Assignments"
        subtitle="Create, publish and manage assignments for your classes."
      />

      {!loading && total > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total"
            value={total}
            icon={<ClipboardList className="h-5 w-5" />}
            tone="brand"
          />
          <StatCard
            label="Published"
            value={published}
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="green"
          />
          <StatCard
            label="Drafts"
            value={drafts}
            icon={<Sparkles className="h-5 w-5" />}
            tone="slate"
          />
          <StatCard
            label="Subjects taught"
            value={teaching.length}
            icon={<GraduationCap className="h-5 w-5" />}
            tone="amber"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader title="Create assignment" subtitle="Save as draft or publish immediately." />
          <CardBody>
            <div className="space-y-4">
              <Field label="Title" htmlFor="as-title" required>
                <Input
                  id="as-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Quadratic Equations Worksheet"
                />
              </Field>
              <Field label="Description" htmlFor="as-description">
                <Textarea
                  id="as-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Instructions for your students..."
                />
              </Field>
              <Field label="Class / Subject" htmlFor="as-ta" required>
                <Select
                  id="as-ta"
                  value={teacherAssignmentId}
                  onChange={(e) => setTeacherAssignmentId(e.target.value)}
                >
                  <option value="">Select...</option>
                  {teaching.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.className} - {t.subjectName}
                    </option>
                  ))}
                </Select>
                {teaching.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    You have not been assigned to any class yet. Contact an admin.
                  </p>
                )}
              </Field>
              <Field label="Deadline" htmlFor="as-deadline" required>
                <Input
                  id="as-deadline"
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </Field>
              <Field label="Maximum marks" htmlFor="as-marks" required>
                <Input
                  id="as-marks"
                  type="number"
                  min="1"
                  step="0.5"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                  placeholder="e.g. 100"
                />
              </Field>
              <Field label="Allowed file types" htmlFor="as-filetypes" hint="e.g. pdf,docx,png,mp4. Leave empty for text-only.">
                <Input
                  id="as-filetypes"
                  value={allowedFileTypes}
                  onChange={(e) => setAllowedFileTypes(e.target.value)}
                  placeholder="pdf, docx, png, mp4"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <Checkbox
                  checked={publish}
                  onChange={(e) => setPublish(e.target.checked)}
                />
                Publish immediately (visible to students)
              </label>
              <Button
                className="w-full"
                onClick={handleCreate}
                loading={saving}
                disabled={!canSubmit}
              >
                <FilePlus2 className="h-4 w-4" /> {publish ? "Create & publish" : "Save draft"}
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your assignments..."
                className="pl-9"
                aria-label="Search assignments"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sm:w-44"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </Select>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
              <Skeleton rows={6} />
            </div>
          ) : filtered.length === 0 ? (
            <TableEmpty
              icon={<ClipboardList className="h-6 w-6" />}
              title={assignments.length === 0 ? "No assignments yet" : "No matching assignments"}
              description={
                assignments.length === 0
                  ? "Create your first assignment using the form."
                  : "Try adjusting your search or filters."
              }
            />
          ) : (
              <Table
                headers={
                  <>
                    <Th>Assignment</Th>
                    <Th>Deadline</Th>
                    <Th>Submissions</Th>
                    <Th>Published</Th>
                    <Th className="text-right">Actions</Th>
                  </>
                }
                empty={null}
              >
                {filtered
                  .sort((a, b) => a.deadline.localeCompare(b.deadline))
                  .map((a) => {
                    const closed = isPast(a.deadline);
                    const subPercent =
                      a.submissionCount > 0
                        ? Math.min(
                            100,
                            Math.round((a.submissionCount / 25) * 100),
                          )
                        : 0;
                    return (
                      <tr
                        key={a.id}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <Td>
                          <p className="font-medium text-slate-900">
                            {a.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {a.className} · {a.subjectName}
                          </p>
                        </Td>
                        <Td>
                          <span
                            className={
                              closed ? "text-rose-600" : ""
                            }
                          >
                            {formatDate(a.deadline)}
                          </span>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-600">
                              {a.submissionCount}
                            </span>
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500"
                                style={{
                                  width: `${subPercent}%`,
                                }}
                              />
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <button
                            onClick={() => handleTogglePublish(a)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              a.isPublished
                                ? "bg-emerald-500"
                                : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                a.isPublished
                                  ? "translate-x-[18px]"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </Td>
                        <Td className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/teacher/assignments/${a.id}`}
                            >
                              <Button size="xs" variant="outline">
                                View
                              </Button>
                            </Link>
                            <Button
                              size="xs"
                              variant="danger"
                              onClick={() => setDeleteTarget(a)}
                            >
                              Delete
                            </Button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
              </Table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete assignment"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This also removes all student submissions for it.`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </AuthGuard>
  );
}
