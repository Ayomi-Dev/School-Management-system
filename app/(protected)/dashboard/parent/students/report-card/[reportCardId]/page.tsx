'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStudentReportCard } from '@/src/hooks/queries/useParent';
import { Loader } from '@/src/components/ui/Loader';
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Users,
  Clock,
  AlertCircle,
  Award,
  MessageSquare,
} from 'lucide-react';

// ─── Grade helpers ────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  A1: { bg: 'bg-emerald-100', text: 'text-emerald-800', bar: 'bg-emerald-500' },
  B2: { bg: 'bg-green-100',   text: 'text-green-800',   bar: 'bg-green-500'   },
  B3: { bg: 'bg-lime-100',    text: 'text-lime-800',    bar: 'bg-lime-500'    },
  C4: { bg: 'bg-yellow-100',  text: 'text-yellow-800',  bar: 'bg-yellow-500'  },
  C5: { bg: 'bg-amber-100',   text: 'text-amber-800',   bar: 'bg-amber-500'   },
  C6: { bg: 'bg-orange-100',  text: 'text-orange-800',  bar: 'bg-orange-500'  },
  D7: { bg: 'bg-red-100',     text: 'text-red-700',     bar: 'bg-red-400'     },
  E8: { bg: 'bg-red-100',     text: 'text-red-800',     bar: 'bg-red-500'     },
  F9: { bg: 'bg-red-200',     text: 'text-red-900',     bar: 'bg-red-600'     },
};

function gradeColor(grade: string | null) {
  if (!grade) return 'text-gray-300';
  return GRADE_COLORS[grade]?.text ?? 'text-gray-700';
}


export default function ParentReportCardPage() {
  const { reportCardId } = useParams<{ reportCardId: string }>();
  const router           = useRouter();

  const { data, isLoading, isError } = useStudentReportCard(reportCardId);

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
        <p className="text-sm text-gray-600">Report card not available.</p>
      </div>
    );
  }

  const { reportCard, student, scores, attendanceSummary } = data;

  const totalScore = scores.reduce((s, r) => s + (r.totalScore ?? 0), 0);
  const average    = scores.length > 0 ? (totalScore / scores.length).toFixed(1) : '—';

  const attendanceRate = attendanceSummary.total > 0
    ? ((attendanceSummary.present + attendanceSummary.late) / attendanceSummary.total * 100).toFixed(1)
    : '0';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Report card header card */}
      <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold shrink-0">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold">{student.firstName} {student.lastName}</h1>
              <p className="text-blue-200 text-sm mt-0.5">{student.studentNumber}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {reportCard.classLevel && (
                  <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full">
                    {reportCard.classLevel}
                  </span>
                )}
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full">
                  {reportCard.term.period} · {reportCard.term.academicYear}
                </span>
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs bg-white/20 px-3 py-1.5 rounded-full shrink-0">
            <CheckCircle2 size={12} />
            Published
          </span>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3 mt-6 border-t border-white/20 pt-5">
          {[
            { label: 'Total Score',   value: reportCard.totalScore ?? totalScore, icon: <Award size={15} />      },
            { label: 'Average',       value: reportCard.average    !== null ? `${reportCard.average}%` : `${average}%`, icon: <Award size={15} /> },
            { label: 'Class Position', value: reportCard.position  !== null ? `#${reportCard.position}` : '—',   icon: <Users size={15} />     },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs text-blue-200 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Sessions',  value: attendanceSummary.total,   icon: <Calendar size={15} className="text-blue-500"   />, color: 'text-gray-900'   },
          { label: 'Present',   value: attendanceSummary.present, icon: <Users    size={15} className="text-emerald-500" />, color: 'text-emerald-700'},
          { label: 'Absent',    value: attendanceSummary.absent,  icon: <Clock    size={15} className="text-red-400"     />, color: 'text-red-600'    },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Score table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Subject Performance</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="py-2.5 px-5 font-semibold text-gray-500 text-xs uppercase tracking-wide w-full">Subject</th>
              <th className="py-2.5 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center whitespace-nowrap">CA /40</th>
              <th className="py-2.5 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center whitespace-nowrap">Exam /60</th>
              <th className="py-2.5 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">Total</th>
              <th className="py-2.5 px-5 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {scores.map((s) => {
              const gc = s.grade ? (GRADE_COLORS[s.grade] ?? null) : null;
              return (
                <tr key={s.subjectId} className="hover:bg-gray-50/60">
                  <td className="py-3 px-5">
                    <p className="font-medium text-gray-900">{s.subjectName}</p>
                    {s.subjectCode && (
                      <p className="text-xs text-gray-400">{s.subjectCode}</p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center text-gray-700">{s.caScore ?? '—'}</td>
                  <td className="py-3 px-3 text-center text-gray-700">{s.examScore ?? '—'}</td>
                  <td className={`py-3 px-3 text-center font-bold ${gradeColor(s.grade)}`}>
                    {s.totalScore ?? '—'}
                  </td>
                  <td className="py-3 px-5 text-center">
                    {gc ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${gc.bg} ${gc.text}`}>
                        {s.grade}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {scores.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-400 text-sm">
                  No scores published for this term.
                </td>
              </tr>
            )}
          </tbody>
          {scores.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="py-3 px-5 font-semibold text-gray-700">Total / Average</td>
                <td colSpan={2} />
                <td className="py-3 px-3 text-center font-bold text-gray-900">{totalScore}</td>
                <td className="py-3 px-5 text-center text-gray-500 text-xs">
                  Avg {average}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Remarks */}
      {(reportCard.teacherRemark || reportCard.principalRemark) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MessageSquare size={15} className="text-gray-400" />
            Remarks
          </h2>
          {reportCard.teacherRemark && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Class Teacher</p>
              <p className="text-sm text-gray-700 bg-blue-50 rounded-xl px-4 py-3 leading-relaxed">
                {reportCard.teacherRemark}
              </p>
            </div>
          )}
          {reportCard.principalRemark && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Principal</p>
              <p className="text-sm text-gray-700 bg-purple-50 rounded-xl px-4 py-3 leading-relaxed">
                {reportCard.principalRemark}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Published footer */}
      <p className="text-center text-xs text-gray-400 pb-4">
        Published on{' '}
        {new Date(reportCard.publishedAt).toLocaleDateString('en-NG', { dateStyle: 'long' })}
      </p>
    </div>
  );
}
