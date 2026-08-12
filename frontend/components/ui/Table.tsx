"use client";

import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";

export function Table({
  headers,
  children,
  empty,
  loading,
  className,
}: {
  headers: React.ReactNode;
  children: React.ReactNode;
  empty?: React.ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50/80">
          <tr className="text-left">{headers}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
      {loading && (
        <div className="p-5">
          <Skeleton rows={4} />
        </div>
      )}
      {!loading && empty}
    </div>
  );
}

export function Th({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}

export function TableEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="p-5">
      <EmptyState icon={icon} title={title} description={description} action={action} />
    </div>
  );
}
