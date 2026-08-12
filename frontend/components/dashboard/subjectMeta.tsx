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
  "গণিত":                       { color: "#2563eb", icon: Calculator },
  "mathematics":                 { color: "#2563eb", icon: Calculator },
  "math":                        { color: "#2563eb", icon: Calculator },
  "সাধারণ বিজ্ঞান":              { color: "#0d9488", icon: Beaker },
  "general science":             { color: "#0d9488", icon: Beaker },
  "science":                     { color: "#0d9488", icon: Beaker },
  "পদার্থবিজ্ঞান":              { color: "#4f46e5", icon: Atom },
  "physics":                     { color: "#4f46e5", icon: Atom },
  "রসায়ন":                       { color: "#7c3aed", icon: FlaskConical },
  "chemistry":                   { color: "#7c3aed", icon: FlaskConical },
  "জীববিজ্ঞান":                 { color: "#059669", icon: Leaf },
  "biology":                     { color: "#059669", icon: Leaf },
  "বাংলা ১ম পত্র":              { color: "#dc2626", icon: Languages },
  "বাংলা ২য় পত্র":              { color: "#e11d48", icon: Languages },
  "bangla 1st paper":            { color: "#dc2626", icon: Languages },
  "bangla 2nd paper":            { color: "#e11d48", icon: Languages },
  "english 1st paper":           { color: "#0284c7", icon: Globe },
  "english 2nd paper":           { color: "#0369a1", icon: Globe },
  "বাংলাদেশ ও বিশ্বপরিচয়":       { color: "#d97706", icon: Landmark },
  "bangladesh & global studies": { color: "#d97706", icon: Landmark },
  "bgs":                         { color: "#d97706", icon: Landmark },
  "তথ্য ও যোগাযোগ প্রযুক্তি":    { color: "#0891b2", icon: Monitor },
  "ict":                         { color: "#0891b2", icon: Monitor },
  "ইসলাম ও নৈতিক শিক্ষা":       { color: "#475569", icon: BookMarked },
  "islam & moral education":     { color: "#475569", icon: BookMarked },
  "শারীরিক শিক্ষা ও স্বাস্থ্য":  { color: "#ea580c", icon: Dumbbell },
  "physical education & health": { color: "#ea580c", icon: Dumbbell },
  "চারু ও কারুকলা":              { color: "#db2777", icon: Palette },
  "arts & crafts":               { color: "#db2777", icon: Palette },
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
