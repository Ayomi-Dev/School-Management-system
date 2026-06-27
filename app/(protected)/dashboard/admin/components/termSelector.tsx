"use client"


import { ScoreRecord } from "@/src/types";
import { ChevronDown } from "lucide-react";
import { useMemo } from "react";

export function TermSelector({
  scores,
  selectedTermId,
  onChange,
}: {
  scores: ScoreRecord[];
  selectedTermId: string | undefined;
  onChange: (termId: string | undefined) => void;
}) {
  // Build a deduplicated list of terms from the scores
  const terms = useMemo(() => {
    const seen = new Map<string, { id: string; label: string }>();
    for (const s of scores) {
      if (!seen.has(s.termId)) {
        seen.set(s.termId, {
          id: s.termId,
          label: `${s.term.period} — ${s.term.academicYear.label}`,
        });
      }
    }
    return Array.from(seen.values());
  }, [scores]);

  if (terms.length === 0) return null;

  return (
    <div className="relative inline-block">
      <select
        value={selectedTermId ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All terms</option>
        {terms.map((t) => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>
      <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}