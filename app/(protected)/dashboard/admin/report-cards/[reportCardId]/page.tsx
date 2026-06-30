'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useReportCard,
  useUpdateReportCardMutation,
  useAdminPublishReportCardMutation,
  useAdminUnpublishReportCardMutation,
} from '@/src/hooks/queries/useAdmin';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  Pencil,
  X,
  Save,
  Calendar,
  Users,
  Clock,
  RotateCcw,
} from 'lucide-react';

// ─── Grade colour helper (same palette used across the admin pages) ───────────

function gradeColor(grade: string | null) {
  const map: Record<string, string> = {
    A1: 'text-emerald-700 font-bold', B2: 'text-green-700',
    B3: 'text-lime-700',              C4: 'text-yellow-700',
    C5: 'text-amber-700',             C6: 'text-orange-700',
    D7: 'text-red-600',               E8: 'text-red-700',
    F9: 'text-red-800 font-bold',
  };
  return grade ? map[grade] ?? 'text-gray-700' : 'text-gray-300';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportCardPage() {
  const { reportCardId } = useParams<{ reportCardId: string }>();
  const router = useRouter();

  const { data, isLoading, isError } = useReportCard(reportCardId);

  // userId for cache-invalidation isn't in the URL here, so we pass undefined —
  // the summary panel on the profile page already invalidates by reportCardId
  // when navigating back, and useReportCard's own key gets busted directly.
  const updateMutation  = useUpdateReportCardMutation(reportCardId);
  const publishMutation = useAdminPublishReportCardMutation('');
  const unpublishMutation = useAdminUnpublishReportCardMutation('');

  const [isEditing, setIsEditing] = useState(false);
  const [teacherRemark, setTeacherRemark] = useState('');
  const [principalRemark, setPrincipalRemark] = useState('');

  // Sync local edit state whenever fresh data arrives
  useEffect(() => {
    if (data?.reportCard) {
      setTeacherRemark(data.reportCard.teacherRemark ?? '');
      setPrincipalRemark(data.reportCard.principalRemark ?? '');
    }
  }, [data?.reportCard]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader /></div>;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-gray-600">Could not load report card.</p>
        <Button variant="outline" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const { reportCard, student, scores, attendanceSummary } = data;
  const isPublished = reportCard.status === 'PUBLISHED';
  const isDirty =
    teacherRemark !== (reportCard.teacherRemark ?? '') ||
    principalRemark !== (reportCard.principalRemark ?? '');

  const totalScore = scores.reduce((s, r) => s + (r.totalScore ?? 0), 0);
  const average = scores.length > 0 ? totalScore / scores.length : 0;

  const handleSave = () => {
    const body: { teacherRemark?: string; principalRemark?: string } = {};
    if (teacherRemark !== (reportCard.teacherRemark ?? '')) body.teacherRemark = teacherRemark;
    if (principalRemark !== (reportCard.principalRemark ?? '')) body.principalRemark = principalRemark;
    updateMutation.mutate(body, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleCancelEdit = () => {
    setTeacherRemark(reportCard.teacherRemark ?? '');
    setPrincipalRemark(reportCard.principalRemark ?? '');
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white text-lg font-bold shrink-0">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {student.firstName} {student.lastName}
              </h1>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-gray-500 mt-0.5">
                <span>{student.studentNumber}</span>
                {reportCard.classLevel && <span>· {reportCard.classLevel}</span>}
                <span>· {reportCard.term.period}, {reportCard.term.academicYear}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {isPublished ? (
                <div className="block">
                    <span className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                        <CheckCircle2 size={14} />
                        Published {reportCard.publishedAt
                        ? new Date(reportCard.publishedAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })
                        : ''}
                    </span>
                    <Button
                    variant="outline"
                    className="flex items-center gap-2 text-amber-700 border-amber-200 hover:bg-amber-50"
                    onClick={() => unpublishMutation.mutate(reportCardId)}
                    disabled={unpublishMutation.isPending}
                    >
                        <RotateCcw size={15} />
                        {unpublishMutation.isPending ? 'Unpublishing…' : 'Unpublish to Edit'}
                    </Button>
                </div>
            ) : (
              <Button
                variant="primary"
                className="flex items-center gap-2"
                onClick={() => publishMutation.mutate(reportCardId)}
                disabled={publishMutation.isPending || !reportCard.teacherRemark?.trim()}
              >
                <Send size={16} />
                {publishMutation.isPending ? 'Publishing…' : 'Publish Report Card'}
              </Button>
            )}
          </div>
        </div>

        {!isPublished && !reportCard.teacherRemark?.trim() && (
          <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mt-4">
            Add a teacher remark before this card can be published.
          </p>
        )}
      </Card>

      {/* Attendance strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4">
          <p className="text-lg font-bold text-gray-900">{attendanceSummary.total}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <Calendar size={12} />Sessions
          </p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-lg font-bold text-green-600">{attendanceSummary.present}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <Users size={12} />Present
          </p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-lg font-bold text-red-500">{attendanceSummary.absent}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <Clock size={12} />Absent
          </p>
        </Card>
      </div>

      {/* Score table */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Subject Scores
        </h2>
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
            {scores.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  No completed scores for this term yet.
                </td>
              </tr>
            )}
          </tbody>
          {scores.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td className="py-2.5 pr-4 font-semibold text-gray-700">
                  Total / Average
                </td>
                <td colSpan={2} />
                <td className="py-2.5 px-3 text-center font-bold text-gray-900">
                  {totalScore}
                </td>
                <td className="py-2.5 pl-3 text-center text-gray-500 text-xs">
                  Avg {average.toFixed(1)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </Card>

      {/* Remarks */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Remarks</h2>
          {!isPublished && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Pencil size={14} />Edit
            </button>
          )}
          {isPublished && (
            <span className="text-xs text-gray-400">Locked — card is published</span>
          )}
        </div>

        <div className="space-y-4">
          {/* Teacher remark */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Teacher Remark</label>
            {isEditing ? (
              <textarea
                value={teacherRemark}
                onChange={(e) => setTeacherRemark(e.target.value)}
                rows={3}
                placeholder="e.g. Shows consistent improvement in core subjects…"
                className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 min-h-10">
                {reportCard.teacherRemark || <span className="text-gray-400 italic">No remark yet</span>}
              </p>
            )}
          </div>

          {/* Principal remark */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Principal Remark</label>
            {isEditing ? (
              <textarea
                value={principalRemark}
                onChange={(e) => setPrincipalRemark(e.target.value)}
                rows={2}
                placeholder="Optional — overall school-level comment"
                className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 min-h-10">
                {reportCard.principalRemark || <span className="text-gray-400 italic">No remark yet</span>}
              </p>
            )}
          </div>

          {isEditing && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-1.5"
                onClick={handleSave}
                disabled={!isDirty || updateMutation.isPending}
              >
                <Save size={14} />
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
              >
                <X size={14} />Cancel
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
