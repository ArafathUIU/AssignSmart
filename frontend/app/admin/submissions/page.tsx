"use client";

import { useMemo, useState } from "react";
import { Inbox, Search } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { api } from "@/lib/api";
import type { Submission } from "@/lib/types";
import { Input, Select } from "@/components/ui/Field";
import { PageHero } from "@/components/ui/PageHero";
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { Table, TableEmpty, Td, Th } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/lib/useAsyncData";
import { formatDate } from "@/lib/utils";

export default function AdminSubmissionsPage() {
  const { data, loading } = useAsyncData(() =>
    api.get<Submission[]>("/api/submissions"),
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const submissions = useMemo(() => data ?? [], [data]);

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

  return (
    <AuthGuard roles={["Admin"]}>
      <PageHero
        title="All Submissions"
        subtitle="Every student submission across the institution."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student or assignment..."
            className="pl-9"
            aria-label="Search submissions"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-44"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="Submitted">Submitted</option>
          <option value="Graded">Graded</option>
          <option value="Returned">Returned</option>
        </Select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <Skeleton rows={6} />
        </div>
      ) : filtered.length === 0 ? (
        <TableEmpty
          icon={<Inbox className="h-6 w-6" />}
          title="No submissions found"
          description={submissions.length === 0 ? "Students have not submitted anything yet." : "Try adjusting your search or filters."}
        />
      ) : (
        <Table
          headers={
            <>
              <Th>Student</Th>
              <Th>Assignment</Th>
              <Th>Status</Th>
              <Th>Marks</Th>
              <Th>Submitted</Th>
            </>
          }
          empty={null}
        >
          {filtered.map((s) => (
            <tr key={s.id} className="transition-colors hover:bg-slate-50">
              <Td className="font-medium text-slate-900">{s.studentName}</Td>
              <Td>{s.assignmentTitle}</Td>
              <Td><SubmissionStatusBadge status={s.status} /></Td>
              <Td>
                {s.marks !== null ? (
                  <span className="font-medium text-slate-900">{s.marks}</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </Td>
              <Td className="text-slate-500">{formatDate(s.submittedAt)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </AuthGuard>
  );
}
