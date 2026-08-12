"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, Users as UsersIcon } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { api } from "@/lib/api";
import type { Role, SchoolClass, User } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { RoleBadge } from "@/components/ui/Badge";
import { PageHero } from "@/components/ui/PageHero";
import { Avatar } from "@/components/ui/Avatar";
import { Table, TableEmpty, Td, Th } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAsyncData } from "@/lib/useAsyncData";
import { formatDateShort } from "@/lib/utils";

const roles: Role[] = ["Admin", "Teacher", "Student"];

interface UserForm {
  id: string | null;
  name: string;
  email: string;
  password: string;
  role: Role;
  classId: string;
}

const emptyForm: UserForm = {
  id: null,
  name: "",
  email: "",
  password: "",
  role: "Student",
  classId: "",
};

export default function AdminUsersPage() {
  const { success, error } = useToast();
  const { data, loading, refresh } = useAsyncData(() =>
    api.get<User[]>("/api/users"),
  );
  const { data: classesAll } = useAsyncData(() =>
    api.get<SchoolClass[]>("/api/classes"),
  );

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const users = useMemo(() => data ?? [], [data]);
  const classOptions = classesAll ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (query) {
        return (
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [users, search, roleFilter]);

  function openCreate() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(user: User) {
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      classId: user.classId ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (form.id) {
        await api.put(`/api/users/${form.id}`, {
          name: form.name,
          email: form.email,
          password: form.password || null,
          role: form.role,
          classId: form.classId || null,
        });
        success("User updated.");
      } else {
        await api.post("/api/users", {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          classId: form.classId || null,
        });
        success("User created.");
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
      await api.delete(`/api/users/${deleteTarget.id}`);
      success("User deleted.");
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
        title="Users"
        subtitle="Manage accounts, roles and class assignments."
        action={
          <Button onClick={openCreate}>
            <UserPlus className="h-4 w-4" /> New user
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9"
            aria-label="Search users"
          />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="sm:w-48"
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <Skeleton rows={5} />
        </div>
      ) : filtered.length === 0 ? (
        <TableEmpty
          icon={<UsersIcon className="h-6 w-6" />}
          title="No users found"
          description={users.length === 0 ? "Create your first user to get started." : "Try adjusting your search or filters."}
          action={
            users.length === 0 ? (
              <Button size="sm" onClick={openCreate}>New user</Button>
            ) : undefined
          }
        />
      ) : (
        <Table
          headers={
            <>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Class</Th>
              <Th>Joined</Th>
              <Th className="text-right">Actions</Th>
            </>
          }
          empty={null}
        >
          {filtered.map((u) => (
            <tr key={u.id} className="transition-colors hover:bg-slate-50">
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} />
                  <div>
                    <p className="font-medium text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
              </Td>
              <Td><RoleBadge role={u.role} /></Td>
              <Td>{u.className ?? <span className="text-slate-400">—</span>}</Td>
              <Td className="text-slate-500">{formatDateShort(u.createdAt)}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="xs" variant="outline" onClick={() => openEdit(u)}>
                    Edit
                  </Button>
                  <Button size="xs" variant="danger" onClick={() => setDeleteTarget(u)}>
                    Delete
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Edit user" : "Create user"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {form.id ? "Save changes" : "Create user"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Full name" htmlFor="u-name" required>
            <Input
              id="u-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Dr. Sarah Ahmed"
            />
          </Field>
          <Field label="Email" htmlFor="u-email" required>
            <Input
              id="u-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@school.edu"
            />
          </Field>
          <Field
            label={form.id ? "Password (leave blank to keep current)" : "Password"}
            htmlFor="u-password"
            required={!form.id}
          >
            <Input
              id="u-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={form.id ? "••••••••" : "Minimum 6 characters"}
              minLength={form.id ? undefined : 6}
            />
          </Field>
          <Field label="Role" htmlFor="u-role" required>
            <Select
              id="u-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </Field>
          {form.role === "Student" && (
            <Field label="Class" htmlFor="u-class" hint="Students must belong to a class to receive assignments.">
              <Select
                id="u-class"
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
              >
                <option value="">No class</option>
                {classOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete user"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </AuthGuard>
  );
}
