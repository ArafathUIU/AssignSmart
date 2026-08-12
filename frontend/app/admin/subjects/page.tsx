"use client";

import { useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { api } from "@/lib/api";
import type { Subject } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { PageHero } from "@/components/ui/PageHero";
import { Table, TableEmpty, Td, Th } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAsyncData } from "@/lib/useAsyncData";

export default function AdminSubjectsPage() {
  const { success, error } = useToast();
  const { data, loading, refresh } = useAsyncData(() =>
    api.get<Subject[]>("/api/subjects"),
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);

  const subjects = data ?? [];

  function openCreate() {
    setEditing(null);
    setName("");
    setCode("");
    setModalOpen(true);
  }

  function openEdit(s: Subject) {
    setEditing(s);
    setName(s.name);
    setCode(s.code ?? "");
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/subjects/${editing.id}`, { name, code: code || null });
        success("Subject updated.");
      } else {
        await api.post("/api/subjects", { name, code: code || null });
        success("Subject created.");
      }
      setModalOpen(false);
      await refresh();
    } catch (err) {
      error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/subjects/${deleteTarget.id}`);
      success("Subject deleted.");
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AuthGuard roles={["Admin"]}>
      <PageHero
        title="Subjects"
        subtitle="Manage the subjects taught at your institution."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New subject
          </Button>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <Skeleton rows={4} />
        </div>
      ) : subjects.length === 0 ? (
        <TableEmpty
          icon={<BookOpen className="h-6 w-6" />}
          title="No subjects yet"
          description="Create your first subject to get started."
          action={
            <Button size="sm" onClick={openCreate}>New subject</Button>
          }
        />
      ) : (
        <Table
          headers={
            <>
              <Th>Name</Th>
              <Th>Code</Th>
              <Th className="text-right">Actions</Th>
            </>
          }
          empty={null}
        >
          {subjects.map((s) => (
            <tr key={s.id} className="transition-colors hover:bg-slate-50">
              <Td className="font-medium text-slate-900">{s.name}</Td>
              <Td>{s.code ?? <span className="text-slate-400">—</span>}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="xs" variant="outline" onClick={() => openEdit(s)}>Edit</Button>
                  <Button size="xs" variant="danger" onClick={() => setDeleteTarget(s)}>Delete</Button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit subject" : "Create subject"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? "Save changes" : "Create subject"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" htmlFor="s-name" required>
            <Input
              id="s-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mathematics"
            />
          </Field>
          <Field label="Code" htmlFor="s-code" hint="Optional short identifier.">
            <Input
              id="s-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. MATH"
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete subject"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This will also remove related teacher assignments.`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </AuthGuard>
  );
}
