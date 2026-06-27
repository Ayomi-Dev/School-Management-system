'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';
import { Save } from 'lucide-react';
import {
  useScoreRoster,
  useSaveScores,
} from '@/src/hooks/queries/useScores';
import { ScoreField } from '@/src/types';

interface ScoreEntryGridProps {
  classId: string;
  subjectId: string;
  field: ScoreField;
  label: string; // "CA" | "Exam" — used in headings/messages
}

/**
 * Shared grid for both CA and Exam score entry. Both pages fetch the same
 * roster (Score rows are one row per student covering both fields) and
 * this component just points its input column + save call at whichever
 * field it was given.
 */
export function ScoreEntryGrid({ classId, subjectId, field, label }: ScoreEntryGridProps) {
  const { data, isLoading, error } = useScoreRoster(classId, subjectId);
  const { mutate: save, isPending: isSaving } = useSaveScores(classId, subjectId);

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const roster = data?.data.roster ?? [];
  const maxScore =
    field === 'caScore'
      ? data?.data.assessmentConfig.caMaxScore
      : data?.data.assessmentConfig.examMaxScore;

  // Seed local draft from fetched roster whenever it (re)loads.
  useEffect(() => {
    if (roster.length > 0) {
      const seeded: Record<string, string> = {};
      roster.forEach((entry) => {
        const current = entry[field];
        seeded[entry.studentId] = current != null ? String(current) : '';
      });
      setDraft(seeded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const dirtyCount = useMemo(() => {
    return roster.filter((entry) => {
      if (entry.isPublished) return false; // published rows are locked, never "dirty"
      const original = entry[field];
      const originalStr = original != null ? String(original) : '';
      return (draft[entry.studentId] ?? '') !== originalStr;
    }).length;
  }, [draft, roster, field]);

  const handleChange = (studentId: string, value: string, isPublished: boolean) => {
    if (isPublished) return; // locked — published scores aren't editable here
    // Allow empty string (clearing) and numeric input only.
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) return;
    setDraft((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSave = () => {
    setSaveMessage(null);

    const entries = roster
      .filter((entry) => !entry.isPublished) // never send published rows to the save endpoint
      .filter((entry) => draft[entry.studentId] !== '' && draft[entry.studentId] !== undefined)
      .map((entry) => ({
        studentId: entry.studentId,
        value: parseFloat(draft[entry.studentId]),
      }))
      .filter((e) => !Number.isNaN(e.value));

    if (entries.length === 0) {
      setSaveMessage('Enter at least one score before saving.');
      return;
    }

    save(
      { field, entries },
      {
        onSuccess: (res) => setSaveMessage(res.message),
        onError: (err: any) =>
          setSaveMessage(err?.response?.data?.error ?? `Could not save ${label} scores.`),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-red-600 font-medium">Could not load the score sheet.</p>
          <p className="text-sm text-gray-500 mt-1">
            {(error as any)?.response?.data?.error ?? 'Please try again.'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{label} Scores</h1>
          <p className="text-gray-600 mt-1">
            {data?.data.termLabel} &middot; Max score: {maxScore} &middot; {roster.length}{' '}
            student{roster.length !== 1 ? 's' : ''}
            {dirtyCount > 0 && (
              <span className="text-amber-600 font-medium"> &middot; {dirtyCount} unsaved</span>
            )}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="flex items-center gap-2"
          onClick={handleSave}
          disabled={isSaving || dirtyCount === 0}
        >
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save Scores'}
        </Button>
      </div>

      {saveMessage && (
        <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          {saveMessage}
        </div>
      )}

      {/* Grid */}
      {roster.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">No students enrolled in this class yet.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-0! overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 font-semibold">Student</th>
                <th className="px-5 py-3 font-semibold w-32">{label} (/{maxScore})</th>
                <th className="px-5 py-3 font-semibold w-20">Grade</th>
                <th className="px-5 py-3 font-semibold w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roster.map((entry) => (
                <tr key={entry.studentId}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">
                      {entry.firstName} {entry.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{entry.admissionNumber}</p>
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={draft[entry.studentId] ?? ''}
                      onChange={(e) => handleChange(entry.studentId, e.target.value, entry.isPublished)}
                      disabled={entry.isPublished}
                      placeholder="—"
                      title={entry.isPublished ? 'Published scores cannot be edited here.' : undefined}
                      className={`w-20 px-2.5 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        entry.isPublished
                          ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300'
                      }`}
                    />
                  </td>
                  <td className="px-5 py-3">
                    {entry.grade ? (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                        {entry.grade}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {entry.isPublished ? (
                      <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium">
                        Published
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full font-medium">
                        Draft
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
