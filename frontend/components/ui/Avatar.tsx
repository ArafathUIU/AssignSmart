"use client";

import { cn, initials } from "@/lib/utils";

const toneClasses = [
  "bg-gradient-to-br from-brand-400 to-brand-600 text-white",
  "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white",
  "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
  "bg-gradient-to-br from-rose-400 to-rose-600 text-white",
  "bg-gradient-to-br from-sky-400 to-sky-600 text-white",
];

export function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const hash = name
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const tone = toneClasses[hash % toneClasses.length];
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-[0_1px_2px_rgb(15_23_42/0.15)]",
        tone,
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
