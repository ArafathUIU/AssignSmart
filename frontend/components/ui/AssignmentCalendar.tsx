"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildMonthGrid,
  dayKey,
  isSameMonth,
  isToday,
  MONTH_LABELS,
  WEEKDAY_LABELS,
} from "@/lib/utils";
import { Card, CardHeader, CardBody } from "./Card";
import { DotBadge } from "./Badge";

export type CalendarItemTone = "brand" | "green" | "amber" | "rose" | "slate";

export interface CalendarItem {
  id: string;
  title: string;
  date: string;
  tone: CalendarItemTone;
  label?: string;
  href?: string;
}

const toneDot: Record<CalendarItemTone, string> = {
  brand: "bg-brand-500",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  slate: "bg-slate-400",
};

const toneBadge: Record<CalendarItemTone, "brand" | "green" | "amber" | "rose" | "slate"> = {
  brand: "brand",
  green: "green",
  amber: "amber",
  rose: "rose",
  slate: "slate",
};

export function AssignmentCalendar({ items }: { items: CalendarItem[] }) {
  const [view, setView] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const key = dayKey(item.date);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [items]);

  const [selected, setSelected] = useState<string | null>(() => dayKey(new Date()));
  const selectedItems = selected ? (byDay.get(selected) ?? []) : [];

  const days = useMemo(() => buildMonthGrid(view), [view]);

  function move(offset: number) {
    setView((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  return (
    <Card>
      <CardHeader
        title="Assignment calendar"
        subtitle="Deadlines and statuses at a glance"
        action={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => move(-1)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[8rem] text-center text-sm font-semibold text-slate-900">
              {MONTH_LABELS[view.getMonth()]} {view.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => move(1)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        }
      />
      <CardBody>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400"
            >
              {label}
            </div>
          ))}
          {days.map((day) => {
            const key = dayKey(day);
            const dayItems = byDay.get(key) ?? [];
            const inMonth = isSameMonth(day, view);
            const today = isToday(day);
            const selectedDay = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-sm transition-all duration-150",
                  inMonth ? "text-slate-700" : "text-slate-300",
                  selectedDay
                    ? "bg-brand-600 text-white shadow-[var(--shadow-glow)]"
                    : today
                      ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200"
                      : "hover:bg-slate-100",
                )}
              >
                <span className={cn("font-medium", !inMonth && "font-normal")}>
                  {day.getDate()}
                </span>
                {dayItems.length > 0 && (
                  <span className="flex items-center gap-0.5">
                    {dayItems.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          selectedDay ? "bg-white" : toneDot[item.tone],
                        )}
                        aria-hidden
                      />
                    ))}
                    {dayItems.length > 3 && (
                      <span
                        className={cn(
                          "text-[9px] font-semibold",
                          selectedDay ? "text-white/80" : "text-slate-400",
                        )}
                      >
                        +{dayItems.length - 3}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Legend
          </span>
          <DotBadge tone="brand" label="Open / not submitted" />
          <DotBadge tone="green" label="Graded" />
          <DotBadge tone="amber" label="Pending review" />
          <DotBadge tone="rose" label="Past deadline" />
        </div>

        <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {selected
              ? new Date(selected).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
              : "Select a day"}
          </p>
          {selectedItems.length === 0 ? (
            <p className="text-sm text-slate-500">
              No assignments due this day.
            </p>
          ) : (
            <ul className="space-y-2">
              {selectedItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", toneDot[item.tone])} aria-hidden />
                    {item.href ? (
                      <a
                        href={item.href}
                        className="truncate font-medium text-slate-800 hover:text-brand-600"
                      >
                        {item.title}
                      </a>
                    ) : (
                      <span className="truncate font-medium text-slate-800">{item.title}</span>
                    )}
                  </div>
                  {item.label && <DotBadge tone={toneBadge[item.tone]} label={item.label} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
