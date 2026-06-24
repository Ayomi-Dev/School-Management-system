'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';
import { CheckCircle2, Circle, ArrowRight, BookOpen } from 'lucide-react';
import { useScoreRoster } from '@/src/hooks/queries/useScores';
import { useMySubjectsForClass } from '@/src/hooks/queries/useTeacher';

// ─── completion ring ─────────────────────────────────────────────────────────

interface CompletionRingProps {
  entered: number;
  total: number;
  label: string;
  color: 'emerald' | 'blue';
}

function CompletionBar({ entered, total, label, color }: CompletionRingProps) {
  const pct = total === 0 ? 0 : Math.round((entered / total) * 100);
  const isComplete = entered === total && total > 0;
  const colorBar = color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500';
  const colorText = color === 'emerald' ? 'text-emerald-700' : 'text-blue-700';
  const colorBg = color === 'emerald' ? 'bg-emerald-50' : 'bg-blue-50';

  return (
    <div className={`rounded-xl p-4 ${colorBg} space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        {isComplete ? (
          <CheckCircle2 size={18} className={colorText} />
        ) : (
          <Circle size={18} className="text-gray-300" />
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${colorText}`}>{entered}</span>
        <span className="text-sm text-gray-400 mb-0.5">/ {total} students</span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 bg-white rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorBar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{pct}% complete</p>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SubjectScoreLandingPage() {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();
  const router = useRouter();

  const { data: rosterData, isLoading } = useScoreRoster(classId, subjectId);
  const { data: subjectsData } = useMySubjectsForClass(classId);

  const roster = rosterData?.data.roster ?? [];
  const total = roster.length;

  // Completion counts — derived client-side from the roster already fetched,
  // no extra endpoint needed.
  const caEntered = roster.filter((s) => s.caScore !== null).length;
  const examEntered = roster.filter((s) => s.examScore !== null).length;
  const bothEntered = roster.filter(
    (s) => s.caScore !== null && s.examScore !== null,
  ).length;

  // Subject name — look it up from the subjects list already in cache.
  const subjectName =
    subjectsData?.data.find((s) => s.subjectId === subjectId)?.name ?? 'Subject';

  const goToCA = () =>
    router.push(`/dashboard/teacher/classes/${classId}/subjects/${subjectId}/scores/ca`);

  const goToExam = () =>
    router.push(`/dashboard/teacher/classes/${classId}/subjects/${subjectId}/scores/exam`);

  const goToHistory = () =>
    router.push(`/dashboard/teacher/classes/${classId}/subjects/${subjectId}/scores/history`);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
          <BookOpen size={20} className="text-emerald-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{subjectName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Score Entry &middot; {total} student{total !== 1 ? 's' : ''} enrolled
            {bothEntered === total && total > 0 && (
              <span className="ml-2 text-emerald-600 font-medium">· All scores complete</span>
            )}
          </p>
        </div>
      </div>

      {/* Completion summary */}
      <div className="grid grid-cols-2 gap-4">
        <CompletionBar
          entered={caEntered}
          total={total}
          label="CA Scores"
          color="emerald"
        />
        <CompletionBar
          entered={examEntered}
          total={total}
          label="Exam Scores"
          color="blue"
        />
      </div>

      {/* Entry actions */}
      <Card>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Enter Scores
          </p>

          {/* CA entry */}
          <button
            onClick={goToCA}
            className="w-full flex items-center justify-between px-4 py-3.5
                       rounded-xl border border-gray-200 hover:border-emerald-300
                       hover:bg-emerald-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-700 font-bold text-xs">CA</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Continuous Assessment</p>
                <p className="text-xs text-gray-500">
                  {caEntered === total && total > 0
                    ? 'All entered — tap to review or edit'
                    : `${total - caEntered} student${total - caEntered !== 1 ? 's' : ''} remaining · max 40`}
                </p>
              </div>
            </div>
            <ArrowRight
              size={18}
              className="text-gray-300 group-hover:text-emerald-600 transition-colors"
            />
          </button>

          {/* Exam entry */}
          <button
            onClick={goToExam}
            className="w-full flex items-center justify-between px-4 py-3.5
                       rounded-xl border border-gray-200 hover:border-blue-300
                       hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-blue-700 font-bold text-xs">EX</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Examination</p>
                <p className="text-xs text-gray-500">
                  {examEntered === total && total > 0
                    ? 'All entered — tap to review or edit'
                    : `${total - examEntered} student${total - examEntered !== 1 ? 's' : ''} remaining · max 60`}
                </p>
              </div>
            </div>
            <ArrowRight
              size={18}
              className="text-gray-300 group-hover:text-blue-600 transition-colors"
            />
          </button>
        </div>
      </Card>

      {/* Score history link */}
      <button
        onClick={goToHistory}
        className="w-full flex items-center justify-between px-4 py-3
                   rounded-xl border border-dashed border-gray-200
                   hover:border-gray-300 hover:bg-gray-50 transition-all text-gray-500
                   hover:text-gray-700"
      >
        <span className="text-sm font-medium">View score history across terms</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
