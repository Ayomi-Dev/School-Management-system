'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Loader } from '@/src/components/ui/Loader';
import { useProfileStore } from '@/src/stores/profileStore';
import { useAuthStore } from '@/src/stores/authStore';
import { useStudentAcademicSummary } from '@/src/hooks/queries/useAcademic';
import { ReportCard, ScoreRecord, StudentProfile } from '@/src/types/api';

// ─── Grade helpers ─────────────────────────────────────────────────────────

interface GradeStyle {
  badge:  string;
  bar:    string;
}

function getGradeStyle(score: number | null): GradeStyle {
  if (score === null) return { badge: 'bg-gray-100 text-gray-400',         bar: 'bg-gray-300'    };
  if (score >= 90)    return { badge: 'bg-emerald-100 text-emerald-700',   bar: 'bg-emerald-500' };
  if (score >= 80)    return { badge: 'bg-sky-100     text-sky-700',       bar: 'bg-sky-500'     };
  if (score >= 75)    return { badge: 'bg-blue-100    text-blue-700',      bar: 'bg-blue-500'    };
  if (score >= 70)    return { badge: 'bg-violet-100  text-violet-700',    bar: 'bg-violet-500'  };
  if (score >= 60)    return { badge: 'bg-amber-100   text-amber-700',     bar: 'bg-amber-400'   };
  if (score >= 50)    return { badge: 'bg-orange-100  text-orange-700',    bar: 'bg-orange-400'  };
  return                     { badge: 'bg-rose-100    text-rose-700',      bar: 'bg-rose-500'    };
}

function waecGrade(score: number | null): string {
  if (score === null) return '—';
  if (score >= 90) return 'A1';
  if (score >= 80) return 'B2';
  if (score >= 75) return 'B3';
  if (score >= 70) return 'C4';
  if (score >= 65) return 'C5';
  if (score >= 60) return 'C6';
  if (score >= 55) return 'D7';
  if (score >= 50) return 'E8';
  return 'F9';
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ScoreRow({ score }: { score: ScoreRecord }) {
  const total  = score.totalScore;
  const style  = getGradeStyle(total);
  const grade  = score.grade ?? waecGrade(total);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Subject */}
      <td className="py-3 px-4">
        <p className="text-sm font-semibold text-gray-800">{score.subject.name}</p>
        <p className="text-xs text-gray-400">{score.subject.code}</p>
      </td>

      {/* CA */}
      <td className="py-3 px-4 text-center">
        <span className="text-sm text-gray-700 font-medium">
          {score.caScore !== null ? `${score.caScore}/40` : '—'}
        </span>
      </td>

      {/* Exam */}
      <td className="py-3 px-4 text-center">
        <span className="text-sm text-gray-700 font-medium">
          {score.examScore !== null ? `${score.examScore}/60` : '—'}
        </span>
      </td>

      {/* Total + mini bar */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`${style.bar} h-1.5 rounded-full transition-all duration-500`}
              style={{ width: `${total ?? 0}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gray-700 w-10 text-right shrink-0">
            {total !== null ? `${total}%` : '—'}
          </span>
        </div>
      </td>

      {/* Grade */}
      <td className="py-3 px-4 text-center">
        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
          {grade}
        </span>
      </td>

      {/* Remark */}
      <td className="py-3 px-4 text-center">
        <span className="text-xs text-gray-500 italic">
          {score.gradeRemark ?? '—'}
        </span>
      </td>
    </tr>
  );
}

function MetaItem({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value ?? '—'}</p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const { profile }  = useProfileStore();
  const schoolId     = useAuthStore((state) => state.user?.schoolId ?? '');
  const studentId    = (profile as StudentProfile)?.id ?? '';

  // Fetch all-time summary (no termId — we filter client-side by report card selection)
  const { data, isLoading, isError } = useStudentAcademicSummary({ studentId, schoolId });

  const reportCards: ReportCard[] = data?.data?.reportCards ?? [];
  const allScores:   ScoreRecord[] = data?.data?.scores     ?? [];

  // ── Filter state ──────────────────────────────────────────────────────────
  // Build unique year options from report cards
  const yearOptions = useMemo(() => {
    const seen = new Map<string, string>();
    reportCards.forEach((rc) => seen.set(rc.academicYearId, rc.academicYear.label));
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [reportCards]);

  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  // Filter report cards by selected year
  const filteredCards = useMemo(() => {
    if (!selectedYearId) return reportCards;
    return reportCards.filter((rc) => rc.academicYearId === selectedYearId);
  }, [reportCards, selectedYearId]);

  // Auto-select first card when year filter changes
  const activeCard: ReportCard | undefined = useMemo(() => {
    if (selectedCardId) {
      const found = filteredCards.find((rc) => rc.id === selectedCardId);
      if (found) return found;
    }
    return filteredCards[0];
  }, [filteredCards, selectedCardId]);

  // Scores for the active report card's term
  const termScores: ScoreRecord[] = useMemo(() => {
    if (!activeCard) return [];
    return allScores.filter((s) => s.termId === activeCard.termId);
  }, [allScores, activeCard]);

  // Summary stats for the active term
  const publishedScores  = termScores.filter((s) => s.isPublished);
  const scoredSubjects   = publishedScores.filter((s) => s.totalScore !== null);
  const termAverage      = scoredSubjects.length > 0
    ? Math.round(scoredSubjects.reduce((acc, s) => acc + (s.totalScore ?? 0), 0) / scoredSubjects.length)
    : null;
  const tscore = allScores.reduce((acc, s) => acc + (s.totalScore ?? 0), 0)
  // ── Loading / error states ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Card className="p-8 flex items-center justify-center">
          <p className="text-sm text-rose-500">Failed to load results. Please try again.</p>
        </Card>
      </div>
    );
  }

  if (reportCards.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Card className="p-8 flex items-center justify-center min-h-50">
          <p className="text-sm text-gray-400">No report cards available yet.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Academic year */}
          <div className="flex flex-col gap-1.5 min-w-45">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest">
              Academic Year
            </label>
            <select
              value={selectedYearId}
              onChange={(e) => { setSelectedYearId(e.target.value); setSelectedCardId(''); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {yearOptions.map((y) => (
                <option key={y.id} value={y.id}>{y.label}</option>
              ))}
            </select>
          </div>

          {/* Term */}
          <div className="flex flex-col gap-1.5 min-w-45">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest">
              Term
            </label>
            <select
              value={activeCard?.id ?? ''}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filteredCards.map((rc) => (
                <option key={rc.id} value={rc.id}>
                  {rc.term.period} — {rc.academicYear.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status badge */}
          {activeCard && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                Status
              </label>
              <span className={`self-start text-xs font-bold px-3 py-2 rounded-lg border ${
                activeCard.status === 'PUBLISHED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50   text-amber-700   border-amber-200'
              }`}>
                {activeCard.status === 'PUBLISHED' ? '✅ Published' : '📝 Draft'}
              </span>
            </div>
          )}
        </div>
      </Card>

      {activeCard && (
        <>
          {/* ── Report card meta ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <MetaItem label="Term"         value={activeCard.term.period} />
            </Card>
            <Card className="p-4">
              <MetaItem label="Position"     value={activeCard.position !== null ? `${activeCard.position}${ordinal(activeCard.position)}` : null} />
            </Card>
            <Card className="p-4">
              <MetaItem label="Term Average" value={activeCard.average !== null ? `${activeCard.average}%` : termAverage !== null ? `${termAverage}%` : null} />
            </Card>
            <Card className="p-4">
              <MetaItem label="Total Score"  value={activeCard.totalScore !== null ? `${activeCard.totalScore}` : null} />
            </Card>
          </div>

          {/* ── Score sheet ────────────────────────────────────────────────────── */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                Report Sheet — <span className='text-blue-300'>{activeCard.term.period}</span> Term, {activeCard.academicYear.label}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {scoredSubjects.length} subject{scoredSubjects.length !== 1 ? 's' : ''} recorded
              </p>
            </div>

            {termScores.length === 0 ? (
              <div className="p-8 flex items-center justify-center text-sm text-gray-400">
                No scores recorded for this term yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">CA (40)</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Exam (60)</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {termScores.map((score) => (
                      <ScoreRow key={score.id} score={score} />
                    ))}
                  </tbody>
                  {/* Footer average row */}
                  {termAverage !== null && (
                    <tfoot>
                      <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td className="py-3 px-4 text-sm font-bold text-gray-700" colSpan={3}>
                          Term Average
                        </td>
                        <td className="py-3 px-4" colSpan={3}>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`${getGradeStyle(termAverage).bar} h-1.5 rounded-full`}
                                style={{ width: `${termAverage}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-800 w-14 text-right shrink-0">
                              {termAverage}% &nbsp;
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${getGradeStyle(termAverage).badge}`}>
                                {waecGrade(termAverage)}
                              </span>
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </Card>

          {/* ── Remarks ────────────────────────────────────────────────────────── */}
          {(activeCard.teacherRemark || activeCard.principalRemark) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeCard.teacherRemark && (
                <Card className="p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
                    Class Teacher's Remark
                  </p>
                  <p className="text-sm text-gray-700 italic leading-relaxed">
                    "{activeCard.teacherRemark}"
                  </p>
                </Card>
              )}
              {activeCard.principalRemark && (
                <Card className="p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
                    Principal's Remark
                  </p>
                  <p className="text-sm text-gray-700 italic leading-relaxed">
                    "{activeCard.principalRemark}"
                  </p>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function PageHeader() {
  return <h1 className="text-2xl font-bold text-gray-800 tracking-tight">📊 Results</h1>;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}
