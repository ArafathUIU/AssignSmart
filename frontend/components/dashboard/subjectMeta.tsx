"use client";

import {
  Atom,
  Beaker,
  BookMarked,
  Calculator,
  Dna,
  FlaskConical,
  Globe,
  Landmark,
  Languages,
  Leaf,
  Lightbulb,
  Music,
  Palette,
  PenTool,
  Piano,
  Sigma,
  Sprout,
  BookOpen,
} from "lucide-react";
import type { ReactNode } from "react";

const gradients = [
  "from-indigo-500 to-violet-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-fuchsia-500 to-purple-600",
  "from-cyan-500 to-sky-600",
  "from-lime-500 to-green-600",
  "from-orange-500 to-red-600",
  "from-blue-500 to-indigo-600",
];

const iconSets: Array<Array<typeof Atom>> = [
  [Calculator, Sigma, Lightbulb],
  [Atom, FlaskConical, Beaker],
  [Globe, Landmark, Languages],
  [Leaf, Sprout, Dna],
  [Palette, PenTool, Music, Piano],
  [BookMarked, BookOpen],
];

export function subjectMeta(name: string): {
  gradient: string;
  Icon: ReactNode;
  hash: number;
} {
  const normalized = name.trim().toLowerCase();
  const hash = [...normalized].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const gradient = gradients[hash % gradients.length];
  const iconSet = iconSets[hash % iconSets.length];
  const Icon = iconSet[hash % iconSet.length];
  return { gradient, Icon: <Icon className="h-5 w-5" />, hash };
}

export function initialLetter(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
