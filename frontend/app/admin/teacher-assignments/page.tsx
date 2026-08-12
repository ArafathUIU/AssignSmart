"use client";

import { useState } from "react";
import { Link2, UserCog } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { api } from "@/lib/api";
import type { SchoolClass, Subject, TeacherAssignment, User } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/Modal";
import { PageHero } from "@/components/ui/PageHero";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, TableEmpty, Td, Th } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAsyncData } from "@/lib/useAsyncData";

export default function AdminTeacherAssignmentsPage() {
  const { success, error } = useToast();
  const { data, loading, refresh } = useAsyncData(() =>
    api.get<TeacherAssignment[]>("/api/teacher-assignments"),
  );
  const { data: teachersData } = useAsyncData(() =>
    api.get<User[]>("/api/users?role=Teacher"),
  );
  const { data: classesData } = useAsyncData(() =>
    api.get<SchoolClass[]>("/api/classes"),
  );
  const { data: subjectsData } = useAsyncData(() =>
    api.get<Subject[]>("/api/subjects"),
  );

  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeacherAssignment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const assignments = data ?? [];
  const teachers = teachersData ?? [];
  const classes = classesData ?? [];
  const subjects = subjectsData ?? [];

  async function handleCreate() {
    if (!teacherId || !classId || !subjectId) return;
    setSaving(true);
    try {
      await api.post("/api/teacher-assignments", { teacherId, classId, subjectId });
      success("Teacher assigned.");
      setTeacherId("");
      setClassId("");
      setSubjectId("");
      await refresh();
    } catch (err) {
      error(err instanceof Error ? err.message : "Assignment failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/teacher-assignments/${deleteTarget.id}`);
      success("Assignment removed.");
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      error(err instanceof Error ? err.message : "Remove failed.");
    } finally {
      setDeleting(false);
    }
  }

  const canSubmit = teacherId && classId && subjectId;

  return (
    <AuthGuard roles={["Admin"]}>
      <PageHero
        title="Teacher Assignments"
        subtitle="Assign teachers to class/subject combinations."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader title="New assignment" subtitle="A teacher must be assigned before creating assignments." />
          <CardBody>
            <div className="space-y-4">
              <Field label="Teacher" htmlFor="ta-teacher" required>
                <Select
                  id="ta-teacher"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                >
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Class" htmlFor="ta-class" required>
                <Select
                  id="ta-class"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Subject" htmlFor="ta-subject" required>
                <Select
                  id="ta-subject"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                >
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </Field>
              <Button
                className="w-full"
                onClick={handleCreate}
                loading={saving}
                disabled={!canSubmit}
              >
                <Link2 className="h-4 w-4" /> Assign teacher
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
              <Skeleton rows={5} />
            </div>
          ) : assignments.length === 0 ? (
            <TableEmpty
              icon={<UserCog className="h-6 w-6" />}
              title="No teacher assignments yet"
              description="Use the form to assign a teacher to a class and subject."
            />
          ) : (
            <Table
              headers={
                <>
                  <Th>Teacher</Th>
                  <Th>Class</Th>
                  <Th>Subject</Th>
                  <Th className="text-right">Actions</Th>
                </>
              }
              empty={null}
            >
              {assignments.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-slate-50">
                  <Td className="font-medium text-slate-900">{a.teacherName}</Td>
                  <Td>{a.className}</Td>
                  <Td>{a.subjectName}</Td>
                  <Td className="text-right">
                    <Button size="xs" variant="danger" onClick={() => setDeleteTarget(a)}>
                      Remove
                    </Button>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove teacher assignment"
        message={`Remove ${deleteTarget?.teacherName} from ${deleteTarget?.className} · ${deleteTarget?.subjectName}?`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </AuthGuard>
  );
}
