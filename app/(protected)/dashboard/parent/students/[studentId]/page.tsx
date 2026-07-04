'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStudentSummary } from '@/src/hooks/queries/useParent';
import type { ParentScoreRecord, ParentReportCardSummary } from '@/src/types/parent';
import { Loader } from '@/src/components/ui/Loader';
import {
  ArrowLeft,
  GraduationCap,
  BarChart2,
  Calendar,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  A1: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  B2: { bg: 'bg-green-100',   text: 'text-green-800'   },
  B3: { bg: 'bg-lime-100',    text: 'text-lime-800'    },
  C4: { bg: 'bg-yellow-100',  text: 'text-yellow-800'  },
  C5: { bg: 'bg-amber-100',   text: 'text-amber-800'   },
  C6: { bg: 'bg-orange-100',  text: 'text-orange-800'  },
  D7: { bg: 'bg-red-100',     text: 'text-red-700'     },
  E8: { bg: 'bg-red-100',     text: 'text-red-800'     },
  F9: { bg: 'bg-red-200',     text: 'text-red-900'     },
};

function GradeChip({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-gray-300 text-sm">—</span>;
  const c = GRADE_COLORS[grade] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${c.bg} ${c.text}`}>
      {grade}
    </span>
  );
}

function gradeTextColor(grade: string | null) {
  if (!grade) return 'text-gray-400';
  const c = GRADE_COLORS[grade];
  return c ? c.text : 'text-gray-700';
}

function attendanceColor(rate: number) {
  if (rate >= 90) return { bar: 'bg-emerald-500', text: 'text-emerald-700' };
  if (rate >= 75) return { bar: 'bg-blue-500',    text: 'text-blue-700'    };
  if (rate >= 60) return { bar: 'bg-amber-500',   text: 'text-amber-700'   };
  return              { bar: 'bg-red-500',     text: 'text-red-700'     };
}

// ─── Term selector ─────────────────────────────────────────────────────────────

function TermSelector({
  scores,
  selectedTermId,
  onChange,
}: {
  scores: ParentScoreRecord[];
  selectedTermId: string | undefined;
  onChange: (id: string | undefined) => void;
}) {
  const terms = useMemo(() => {
    const seen = new Map<string, { id: string; label: string }>();
    for (const s of scores) {
      if (!seen.has(s.termId)) {
        seen.set(s.termId, {
          id:    s.termId,
          label: `${s.term.period} — ${s.term.academicYear.label}`,
        });
      }
    }
    return Array.from(seen.values());
  }, [scores]);

  if (terms.length === 0) return null;

  return (
    <div className="relative">
      term
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

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'scores' | 'attendance' | 'reportcards';

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  scores,
  attendance,
  reportCards,
  onTabSwitch,
}: {
  scores:      ParentScoreRecord[];
  attendance:  ReturnType<typeof useStudentSummary>['data'] extends infer D
               ? D extends object ? (D & { attendance: any })['attendance'] : never
               : never;
  reportCards: ParentReportCardSummary[];
  onTabSwitch: (tab: Tab) => void;
}) {
  const atColors = attendanceColor(attendance.rate);

  // Average from all published scores
  const publishedScores = scores.filter((s) => s.totalScore !== null);
  const avg = publishedScores.length
    ? (publishedScores.reduce((a, s) => a + (s.totalScore ?? 0), 0) / publishedScores.length).toFixed(1)
    : null;

  // Grade distribution
  const gradeDist = publishedScores.reduce<Record<string, number>>((acc, s) => {
    if (s.grade) acc[s.grade] = (acc[s.grade] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Attendance',
            value: `${attendance.rate}%`,
            sub:   `${attendance.present + attendance.late}/${attendance.total} sessions`,
            color: atColors.text,
            icon:  <Calendar size={16} className={atColors.text} />,
          },
          {
            label: 'Avg Score',
            value: avg ? `${avg}%` : '—',
            sub:   `${publishedScores.length} subjects`,
            color: 'text-blue-700',
            icon:  <TrendingUp size={16} className="text-blue-500" />,
          },
          {
            label: 'Absences',
            value: String(attendance.absent),
            sub:   `${attendance.late} late`,
            color: attendance.absent > 5 ? 'text-red-600' : 'text-gray-700',
            icon:  <AlertCircle size={16} className={attendance.absent > 5 ? 'text-red-400' : 'text-gray-400'} />,
          },
          {
            label: 'Report Cards',
            value: String(reportCards.length),
            sub:   'Published',
            color: 'text-emerald-700',
            icon:  <FileText size={16} className="text-emerald-500" />,
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">{kpi.icon}<span className="text-xs text-gray-500">{kpi.label}</span></div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Attendance bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Attendance Rate</h3>
          <span className={`text-sm font-bold ${atColors.text}`}>{attendance.rate}%</span>
        </div>
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${atColors.bar} transition-all duration-700`}
            style={{ width: `${Math.min(attendance.rate, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-xs text-gray-500">
          <span>Present: <b className="text-gray-700">{attendance.present}</b></span>
          <span>Late: <b className="text-gray-700">{attendance.late}</b></span>
          <span>Absent: <b className="text-red-600">{attendance.absent}</b></span>
          <span>Total: <b className="text-gray-700">{attendance.total}</b></span>
        </div>
      </div>

      {/* Grade distribution */}
      {Object.keys(gradeDist).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Grade Distribution</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(gradeDist)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([grade, count]) => {
                const c = GRADE_COLORS[grade] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
                return (
                  <div key={grade} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${c.bg}`}>
                    <span className={`text-sm font-bold ${c.text}`}>{grade}</span>
                    <span className={`text-xs ${c.text} opacity-70`}>×{count}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => onTabSwitch('scores')}
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:bg-blue-50/40 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <BarChart2 size={17} className="text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">View Scores</p>
              <p className="text-xs text-gray-400">{publishedScores.length} subjects published</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500" />
        </button>
        <button
          onClick={() => onTabSwitch('reportcards')}
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileText size={17} className="text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700">Report Cards</p>
              <p className="text-xs text-gray-400">{reportCards.length} published</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500" />
        </button>
      </div>
    </div>
  );
}

// ─── Scores tab ───────────────────────────────────────────────────────────────

function ScoresTab({ scores }: { scores: ParentScoreRecord[] }) {
  const [termId, setTermId] = useState<string | undefined>(undefined);

  const visible = termId ? scores.filter((s) => s.termId === termId) : scores;

  const total = visible.reduce((a, s) => a + (s.totalScore ?? 0), 0);
  const avg   = visible.length > 0 ? (total / visible.length).toFixed(1) : '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{visible.length} subject{visible.length !== 1 ? 's' : ''}</p>
        <TermSelector scores={scores} selectedTermId={termId} onChange={setTermId} />
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
          No published scores yet{termId ? ' for this term' : ''}.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-full">Subject</th>
                <th className="py-3 px-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">CA /40</th>
                <th className="py-3 px-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Exam /60</th>
                <th className="py-3 px-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((s) => (
                <tr key={`${s.subjectId}-${s.termId}`} className="hover:bg-gray-50/60">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{s.subjectName}</p>
                    <p className="text-xs text-gray-400">
                      {s.subjectCode && <span className="mr-2">{s.subjectCode}</span>}
                      {!termId && <span className="text-gray-300">{s.term.period} · {s.term.academicYear.label}</span>}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-center text-gray-700">{s.caScore ?? '—'}</td>
                  <td className="py-3 px-3 text-center text-gray-700">{s.examScore ?? '—'}</td>
                  <td className={`py-3 px-3 text-center font-bold ${gradeTextColor(s.grade)}`}>
                    {s.totalScore ?? '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <GradeChip grade={s.grade} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="py-3 px-4 font-semibold text-gray-700">Total / Average</td>
                <td colSpan={2} />
                <td className="py-3 px-3 text-center font-bold text-gray-900">{total}</td>
                <td className="py-3 px-4 text-center text-gray-500 text-xs">Avg {avg}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Attendance tab ───────────────────────────────────────────────────────────

function AttendanceTab({
  attendance,
}: {
  attendance: { total: number; present: number; late: number; absent: number; unmarked: number; rate: number };
}) {
  const colors = attendanceColor(attendance.rate);

  const stats = [
    { label: 'Present',  value: attendance.present,  color: 'bg-emerald-500', textColor: 'text-emerald-700', pct: attendance.total > 0 ? (attendance.present  / attendance.total * 100).toFixed(0) : '0' },
    { label: 'Late',     value: attendance.late,     color: 'bg-amber-500',   textColor: 'text-amber-700',   pct: attendance.total > 0 ? (attendance.late     / attendance.total * 100).toFixed(0) : '0' },
    { label: 'Absent',   value: attendance.absent,   color: 'bg-red-500',     textColor: 'text-red-700',     pct: attendance.total > 0 ? (attendance.absent   / attendance.total * 100).toFixed(0) : '0' },
    { label: 'Unmarked', value: attendance.unmarked, color: 'bg-gray-300',    textColor: 'text-gray-500',    pct: attendance.total > 0 ? (attendance.unmarked / attendance.total * 100).toFixed(0) : '0' },
  ];

  return (
    <div className="space-y-5">
      {/* Big rate display */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Overall Attendance Rate</p>
        <p className={`text-5xl font-black ${colors.text}`}>{attendance.rate}%</p>
        <p className="text-sm text-gray-400 mt-1">{attendance.total} total sessions</p>
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden mt-5 mx-auto max-w-sm">
          <div
            className={`h-full rounded-full ${colors.bar} transition-all duration-700`}
            style={{ width: `${Math.min(attendance.rate, 100)}%` }}
          />
        </div>
      </div>

      {/* Breakdown cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-2 h-2 rounded-full ${s.color} mb-3`} />
            <p className={`text-2xl font-bold ${s.textColor}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            <p className="text-[11px] text-gray-300 mt-1">{s.pct}%</p>
          </div>
        ))}
      </div>

      {/* Stacked bar */}
      {attendance.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Breakdown</h3>
          <div className="flex h-4 rounded-full overflow-hidden gap-px">
            {stats.filter((s) => s.value > 0).map((s) => (
              <div
                key={s.label}
                className={`${s.color} transition-all`}
                style={{ width: `${(s.value / attendance.total) * 100}%` }}
                title={`${s.label}: ${s.value}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {stats.filter((s) => s.value > 0).map((s) => (
              <span key={s.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full ${s.color} inline-block`} />
                {s.label} ({s.pct}%)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Report cards tab ─────────────────────────────────────────────────────────

function ReportCardsTab({ reportCards }: { reportCards: ParentReportCardSummary[] }) {
  const router = useRouter();

  if (reportCards.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
        No published report cards yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reportCards.map((rc) => (
        <button
          key={rc.id}
          onClick={() => router.push(`/parent/report-cards/${rc.id}`)}
          className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <FileText size={18} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
              {rc.term.period} — {rc.academicYear.label}
            </p>
            <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-gray-500">
              {rc.average !== null && <span>Avg: <b>{rc.average}%</b></span>}
              {rc.position !== null && <span>Position: <b>{rc.position}</b></span>}
              {rc.totalScore !== null && <span>Total: <b>{rc.totalScore}</b></span>}
            </div>
            {rc.teacherRemark && (
              <p className="text-xs text-gray-400 mt-1 truncate italic">"{rc.teacherRemark}"</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={10} />
              Published
            </span>
            <ChevronRight size={15} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const router        = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [termId, setTermId]       = useState<string | undefined>(undefined);

  const { data, isLoading, isError } = useStudentSummary(studentId, true, termId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={36} className="text-red-400" />
        <p className="text-sm text-gray-600">Could not load student details.</p>
      </div>
    );
  }

  const { student, scores, attendance, reportCards } = data;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview',     label: 'Overview',      icon: <TrendingUp size={15} /> },
    { id: 'scores',       label: 'Scores',        icon: <BarChart2 size={15} />,  count: scores.length },
    { id: 'attendance',   label: 'Attendance',    icon: <Calendar size={15} />  },
    { id: 'reportcards',  label: 'Report Cards',  icon: <FileText size={15} />,   count: reportCards.length },
  ];

  return (
    <div className="w-full mx-auto px-4 py-8 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to My Children
      </button>

      {/* Student header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">
              {student.firstName} {student.lastName}
            </h1>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500 mt-1">
              <span>{student.studentNumber}</span>
              {student.currentClass && (
                <span className="flex items-center gap-1">
                  <GraduationCap size={13} />
                  {student.currentClass.level}
                </span>
              )}
              <span>{student.school.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white rounded-t-xl">
        <nav className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab panels */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab
            scores={scores}
            attendance={attendance}
            reportCards={reportCards}
            onTabSwitch={setActiveTab}
          />
        )}
        {activeTab === 'scores' && <ScoresTab scores={scores} />}
        {activeTab === 'attendance' && <AttendanceTab attendance={attendance} />}
        {activeTab === 'reportcards' && <ReportCardsTab reportCards={reportCards} />}
      </div>
    </div>
  );
}
