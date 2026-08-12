"use client";

import { useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { api } from "@/lib/api";
import type { SchoolClass } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { PageHero } from "@/components/ui/PageHero";
import { Table, TableEmpty, Td, Th } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAsyncData } from "@/lib/useAsyncData";

export default function AdminClassesPage() {
  const { success, error } = useToast();
  const { data, loading, refresh } = useAsyncData(() =>
    api.get<SchoolClass[]>("/api/classes"),
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SchoolClass | null>(null);
  const [deleting, setDeleting] = useState(false);

  const classes = data ?? [];

  function openCreate() {
    setEditing(null);
    setName("");
    setCode("");
    setModalOpen(true);
  }

  function openEdit(c: SchoolClass) {
    setEditing(c);
    setName(c.name);
    setCode(c.code ?? "");
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/classes/${editing.id}`, { name, code: code || null });
        success("Class updated.");
      } else {
        await api.post("/api/classes", { name, code: code || null });
        success("Class created.");
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
      await api.delete(`/api/classes/${deleteTarget.id}`);
      success("Class deleted.");
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
        title="Classes"
        subtitle="Organize students into classes or courses."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New class
          </Button>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <Skeleton rows={4} />
        </div>
      ) : classes.length === 0 ? (
        <TableEmpty
          icon={<GraduationCap className="h-6 w-6" />}
          title="No classes yet"
          description="Create your first class to get started."
          action={
            <Button size="sm" onClick={openCreate}>New class</Button>
          }
        />
      ) : (
        <Table
          headers={
            <>
              <Th>Name</Th>
              <Th>Code</Th>
              <Th>Students</Th>
              <Th className="text-right">Actions</Th>
            </>
          }
          empty={null}
        >
          {classes.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-slate-50">
              <Td className="font-medium text-slate-900">{c.name}</Td>
              <Td>{c.code ?? <span className="text-slate-400">—</span>}</Td>
              <Td>{c.studentCount ?? 0}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="xs" variant="outline" onClick={() => openEdit(c)}>Edit</Button>
                  <Button size="xs" variant="danger" onClick={() => setDeleteTarget(c)}>Delete</Button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit class" : "Create class"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? "Save changes" : "Create class"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" htmlFor="c-name" required>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Class 10 - Section A"
            />
          </Field>
          <Field label="Code" htmlFor="c-code" hint="Optional short identifier.">
            <Input
              id="c-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 10-A"
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete class"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This will also remove its teacher assignments and associated users may be affected.`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </AuthGuard>
  );
}
