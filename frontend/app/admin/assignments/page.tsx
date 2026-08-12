"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { api } from "@/lib/api";
import type { Assignment } from "@/lib/types";
import { Input, Select } from "@/components/ui/Field";
import { PageHero } from "@/components/ui/PageHero";
import { AssignmentStatusBadge } from "@/components/ui/Badge";
import { Table, TableEmpty, Td, Th } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/lib/useAsyncData";
import { formatDate } from "@/lib/utils";

export default function AdminAssignmentsPage() {
  const { data, loading } = useAsyncData(() =>
    api.get<Assignment[]>("/api/assignments"),
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const assignments = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assignments.filter((a) => {
      if (statusFilter === "published" && !a.isPublished) return false;
      if (statusFilter === "draft" && a.isPublished) return false;
      if (query) {
        return (
          a.title.toLowerCase().includes(query) ||
          a.className.toLowerCase().includes(query) ||
          a.subjectName.toLowerCase().includes(query) ||
          a.teacherName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [assignments, search, statusFilter]);

  return (
    <AuthGuard roles={["Admin"]}>
      <PageHero
        title="All Assignments"
        subtitle="Every assignment created across the institution."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, class, subject or teacher..."
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
          title="No assignments found"
          description={assignments.length === 0 ? "Teachers have not created any assignments yet." : "Try adjusting your search or filters."}
        />
      ) : (
        <Table
          headers={
            <>
              <Th>Title</Th>
              <Th>Class</Th>
              <Th>Subject</Th>
              <Th>Teacher</Th>
              <Th>Deadline</Th>
              <Th>Status</Th>
              <Th className="text-right">Subs</Th>
            </>
          }
          empty={null}
        >
          {filtered.map((a) => (
            <tr key={a.id} className="transition-colors hover:bg-slate-50">
              <Td>
                <Link
                  href={`/teacher/assignments/${a.id}`}
                  className="font-medium text-slate-900 hover:text-brand-600"
                >
                  {a.title}
                </Link>
              </Td>
              <Td>{a.className}</Td>
              <Td>{a.subjectName}</Td>
              <Td>{a.teacherName}</Td>
              <Td className="text-slate-500">{formatDate(a.deadline)}</Td>
              <Td><AssignmentStatusBadge published={a.isPublished} /></Td>
              <Td className="text-right">{a.submissionCount}</Td>
            </tr>
          ))}
        </Table>
      )}
    </AuthGuard>
  );
}
