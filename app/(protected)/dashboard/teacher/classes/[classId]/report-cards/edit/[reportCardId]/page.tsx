'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';
import {
  CheckCircle2,
  Clock,
  Trophy,
  ArrowLeft,
  Save,
  Send,
} from 'lucide-react';
import {
  useReportCard,
  useUpdateReportCardRemark,
  usePublishReportCard,
} from '@/src/hooks/queries/useReportCard';
import { AttendanceSummary, ScoreEntry } from '@/src/types';

// ─── score table ──────────────────────────────────────────────────────────────

function ScoreTable({ scores }: { scores: ScoreEntry[] }) {
  const gradeColor = (grade: string | null) => {
    if (!grade) return 'text-gray-400';
    const map: Record<string, string> = {
      A: 'text-emerald-700 font-bold',
      B: 'text-blue-700 font-bold',
      C: 'text-amber-700 font-bold',
      D: 'text-orange-600 font-bold',
      F: 'text-red-600 font-bold',
    };
    return map[grade] ?? 'text-gray-700';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="py-2.5 pr-4 font-semibold text-gray-600 w-full">Subject</th>
            <th className="py-2.5 px-3 font-semibold text-gray-600 text-center whitespace-nowrap">CA /40</th>
            <th className="py-2.5 px-3 font-semibold text-gray-600 text-center whitespace-nowrap">Exam /60</th>
            <th className="py-2.5 px-3 font-semibold text-gray-600 text-center whitespace-nowrap">Total</th>
            <th className="py-2.5 pl-3 font-semibold text-gray-600 text-center">Grade</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {scores.map((s) => (
            <tr key={s.subjectId}>
              <td className="py-2.5 pr-4">
                <p className="font-medium text-gray-900">{s.subjectName}</p>
                {s.subjectCode && (
                  <p className="text-xs text-gray-400">{s.subjectCode}</p>
                )}
              </td>
              <td className="py-2.5 px-3 text-center text-gray-700">{s.caScore ?? '—'}</td>
              <td className="py-2.5 px-3 text-center text-gray-700">{s.examScore ?? '—'}</td>
              <td className="py-2.5 px-3 text-center font-semibold text-gray-900">
                {s.totalScore ?? '—'}
              </td>
              <td className={`py-2.5 pl-3 text-center ${gradeColor(s.grade)}`}>
                {s.grade ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-200">
            <td className="py-2.5 pr-4 font-semibold text-gray-700">
              Total / Average
            </td>
            <td colSpan={2} />
            <td className="py-2.5 px-3 text-center font-bold text-gray-900">
              {scores.reduce((s, r) => s + (r.totalScore ?? 0), 0)}
            </td>
            <td className="py-2.5 pl-3 text-center text-gray-500 text-xs">
              {scores.length > 0
                ? `Avg ${(
                    scores.reduce((s, r) => s + (r.totalScore ?? 0), 0) /
                    scores.length
                  ).toFixed(1)}`
                : '—'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── attendance summary ───────────────────────────────────────────────────────

function AttendanceBlock({ summary }: { summary: AttendanceSummary }) {
  const pct =
    summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;

  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="text-center">
        <p className="text-lg font-bold text-emerald-700">{summary.present}</p>
        <p className="text-xs text-gray-500">Present</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-red-600">{summary.absent}</p>
        <p className="text-xs text-gray-500">Absent</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-amber-600">{summary.late}</p>
        <p className="text-xs text-gray-500">Late</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-gray-900">{summary.total}</p>
        <p className="text-xs text-gray-500">Total Days</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-blue-700">{pct}%</p>
        <p className="text-xs text-gray-500">Attendance</p>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function EditReportCardPage() {
  const { classId, reportCardId } = useParams<{
    classId: string;
    reportCardId: string;
  }>();
  const router = useRouter();

  const { data, isLoading } = useReportCard(classId, reportCardId);
  const { mutate: saveRemark, isPending: isSavingRemark } =
    useUpdateReportCardRemark(classId, reportCardId);
  const { mutate: publish, isPending: isPublishing } =
    usePublishReportCard(classId, reportCardId);

  const [remark, setRemark] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Seed remark textarea from fetched data
  useEffect(() => {
    if (data?.data.reportCard.teacherRemark) {
      setRemark(data.data.reportCard.teacherRemark);
    }
  }, [data]);

  const card = data?.data.reportCard;
  const student = data?.data.student;
  const scores = data?.data.scores ?? [];
  const attendance = data?.data.attendanceSummary;
  const isPublished = card?.status === 'PUBLISHED';

  const handleSaveRemark = () => {
    setMessage(null);
    saveRemark(remark, {
      onSuccess: () => setMessage({ type: 'success', text: 'Remark saved.' }),
      onError: (err: any) =>
        setMessage({
          type: 'error',
          text: err?.response?.data?.error ?? 'Could not save remark.',
        }),
    });
  };

  const handlePublish = () => {
    setMessage(null);
    publish(undefined, {
      onSuccess: () =>
        setMessage({ type: 'success', text: 'Report card published successfully.' }),
      onError: (err: any) =>
        setMessage({
          type: 'error',
          text: err?.response?.data?.error ?? 'Could not publish report card.',
        }),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader />
      </div>
    );
  }

  if (!card || !student) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-red-600">Report card not found.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back + header */}
      <div>
        <button
          onClick={() =>
            router.push(`/dashboard/teacher/classes/${classId}/report-cards/compile`)
          }
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700
                     transition-colors mb-3"
        >
          <ArrowLeft size={15} /> Back to all report cards
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {student.studentNumber} · {card.classSnapshot}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {card.position && (
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700
                              px-3 py-1.5 rounded-full text-sm font-semibold">
                <Trophy size={14} />
                {card.position}{card.position === 1 ? 'st' : card.position === 2 ? 'nd' : card.position === 3 ? 'rd' : 'th'}
              </div>
            )}
            {isPublished ? (
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700
                               px-3 py-1.5 rounded-full text-sm font-semibold">
                <CheckCircle2 size={14} /> Published
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700
                               px-3 py-1.5 rounded-full text-sm font-semibold">
                <Clock size={14} /> Draft
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Score', value: card.totalScore ?? '—' },
          { label: 'Average', value: card.average != null ? `${card.average}%` : '—' },
          { label: 'Subjects', value: scores.length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center"
          >
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Score breakdown */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
          Academic Performance
        </h2>
        <ScoreTable scores={scores} />
      </Card>

      {/* Attendance */}
      {attendance && (
        <Card>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
            Attendance Summary
          </h2>
          <AttendanceBlock summary={attendance} />
        </Card>
      )}

      {/* Teacher remark */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Teacher's Remark
        </h2>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          disabled={isPublished}
          placeholder={
            isPublished
              ? 'Card is published — remark is locked.'
              : 'Write your remark for this student...'
          }
          rows={4}
          className={`w-full px-3.5 py-2.5 border rounded-lg text-sm resize-none
                      focus:outline-none focus:ring-2 focus:ring-emerald-500
                      placeholder:text-gray-400 transition-colors
                      ${isPublished
                        ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                        : 'border-gray-300 text-gray-900'}`}
        />
        {card.principalRemark && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-1">Principal's Remark</p>
            <p className="text-sm text-gray-700">{card.principalRemark}</p>
          </div>
        )}

        {message && (
          <p
            className={`mt-3 text-sm px-3 py-2 rounded-lg border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
          >
            {message.text}
          </p>
        )}
      </Card>

      {/* Actions */}
      {!isPublished && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2 flex-1"
            onClick={handleSaveRemark}
            disabled={isSavingRemark || !remark.trim()}
          >
            <Save size={16} />
            {isSavingRemark ? 'Saving...' : 'Save Remark'}
          </Button>
          <Button
            variant="primary"
            className="flex items-center gap-2 flex-1"
            onClick={handlePublish}
            disabled={isPublishing || !remark.trim()}
            title={!remark.trim() ? 'Add a remark before publishing' : undefined}
          >
            <Send size={16} />
            {isPublishing ? 'Publishing...' : 'Publish Report Card'}
          </Button>
        </div>
      )}

      {isPublished && card.publishedAt && (
        <p className="text-sm text-center text-gray-400">
          Published on{' '}
          {new Date(card.publishedAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      )}
    </div>
  );
}
