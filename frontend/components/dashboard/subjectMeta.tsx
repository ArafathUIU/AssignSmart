"use client";

import {
  Atom,
  Beaker,
  BookMarked,
  BookOpen,
  Calculator,
  FlaskConical,
  Globe,
  Landmark,
  Languages,
  Leaf,
  Monitor,
  Palette,
  Dumbbell,
} from "lucide-react";

const subjectMap: Record<string, { color: string; icon: typeof BookOpen }> = {
  "mathematics":               { color: "#2563eb", icon: Calculator },
  "math":                      { color: "#2563eb", icon: Calculator },
  "general science":           { color: "#0d9488", icon: Beaker },
  "science":                   { color: "#0d9488", icon: Beaker },
  "physics":                   { color: "#4f46e5", icon: Atom },
  "chemistry":                 { color: "#7c3aed", icon: FlaskConical },
  "biology":                   { color: "#059669", icon: Leaf },
  "bangla 1st paper":         { color: "#dc2626", icon: Languages },
  "bangla 2nd paper":         { color: "#e11d48", icon: Languages },
  "english 1st paper":        { color: "#0284c7", icon: Globe },
  "english 2nd paper":        { color: "#0369a1", icon: Globe },
  "bangladesh & global studies": { color: "#d97706", icon: Landmark },
  "bgs":                       { color: "#d97706", icon: Landmark },
  "ict":                       { color: "#0891b2", icon: Monitor },
  "islam & moral education":  { color: "#475569", icon: BookMarked },
  "physical education & health": { color: "#ea580c", icon: Dumbbell },
  "arts & crafts":             { color: "#db2777", icon: Palette },
};

const fallback = { color: "#6366f1", icon: BookOpen };

export function subjectMeta(name: string): {
  color: string;
  Icon: React.ReactNode;
} {
  const key = name.trim().toLowerCase();
  const match = subjectMap[key];
  if (!match) {
    const Icon = fallback.icon;
    return { color: fallback.color, Icon: <Icon className="h-5 w-5" /> };
  }
  const Icon = match.icon;
  return { color: match.color, Icon: <Icon className="h-5 w-5" /> };
}

export function initialLetter(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
