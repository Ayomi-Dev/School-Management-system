'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText, Send, Undo2 } from 'lucide-react';
import { useStudentAcademicSummary, useAdminPublishReportCardMutation, useAdminUnpublishReportCardMutation } from '@/src/hooks/queries/useAdmin';
import { useTerms } from '@/src/hooks/queries/useAcademic';
import { useAuthStore } from '@/src/stores/authStore';
import { ReportCardDownloadButton } from '@/src/components/reportCards/ReportCardDownloadButton';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';
import type { ReportCard, ScoreRecord } from '@/src/types';

export default function StudentAcademicReportsPage() {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const router = useRouter();
  const schoolId = useAuthStore((state) => state.user?.schoolId ?? '');
  const [termId, setTermId] = useState('');
  const { data, isLoading, isError } = useStudentAcademicSummary(studentId, true, schoolId, termId || undefined);
  const { data: terms = [] } = useTerms();
  const publishMutation = useAdminPublishReportCardMutation(studentId);
  const unpublishMutation = useAdminUnpublishReportCardMutation(studentId);

  if (isLoading) return <div className="flex min-h-80 items-center justify-center"><Loader /></div>;
  if (isError || !data?.data) return <Card><p className="py-10 text-center text-sm text-red-600">Could not load this student’s academic reports.</p></Card>;

  const summary = data.data;
  console.log('summary', summary);
  const currentTermId = terms?.find((term) => term.isCurrent)?.id;
  const reports = summary.reportCards as ReportCard[];
  const scores = summary.scores as ScoreRecord[];
  const termName = (id: string) => {
    const term = terms?.find((item) => item.id === id);
    return term ? `${term.period} — ${term.academicYear?.label ?? ''}` : id;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <button onClick={() => router.push(`/dashboard/admin/classes/${classId}`)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={16} />Back to class</button>
      <Card>
        <h1 className="text-2xl font-bold text-gray-900">{summary.student.firstName} {summary.student.lastName}</h1>
        <p className="mt-1 text-sm text-gray-500">Academic reports · {summary.student.studentNumber}</p>
        <label className="mt-4 flex max-w-sm flex-col gap-1 text-xs font-medium uppercase tracking-wide text-gray-500">Term / session
          <select value={termId} onChange={(event) => setTermId(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-800">
            <option value="">All sessions</option>
            {terms?.map((term) => <option key={term.id} value={term.id}>{termName(term.id)}</option>)}
          </select>
        </label>
      </Card>

      {reports.length > 0 ? reports.map((report) => {
        const isCurrent = report.termId === currentTermId;
        return (
          <Card key={report.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><FileText size={18} />{report.term.period} — {report.academicYear.label}</h2>
                <p className="mt-1 text-sm text-gray-500">Average {report.average ?? '—'} · Total {report.totalScore ?? '—'} · Position {report.position ?? '—'}</p>
                {report.teacherRemark && <p className="mt-2 text-sm italic text-gray-600">{report.teacherRemark}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ReportCardDownloadButton reportCardId={report.id} />
                {isCurrent && report.status === 'DRAFT' && <Button variant="primary" size="sm" className="flex items-center gap-1.5" disabled={publishMutation.isPending} onClick={() => publishMutation.mutate(report.id)}><Send size={14} />Publish</Button>}
                {isCurrent && report.status === 'PUBLISHED' && <Button variant="outline" size="sm" className="flex items-center gap-1.5" disabled={unpublishMutation.isPending} onClick={() => unpublishMutation.mutate(report.id)}><Undo2 size={14} />Unpublish</Button>}
                {report.status === 'PUBLISHED' && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 size={13} />Published</span>}
              </div>
            </div>
            <div className="mt-4 overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full min-w-160 text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-2.5">Subject</th><th className="px-4 py-2.5 text-center">CA</th><th className="px-4 py-2.5 text-center">Exam</th><th className="px-4 py-2.5 text-center">Total</th><th className="px-4 py-2.5 text-center">Grade</th><th className="px-4 py-2.5">Remark</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {scores.filter((score) => score.termId === report.termId).map((score) => <tr key={score.id}><td className="px-4 py-2.5 font-medium">{score.subject.name}</td><td className="px-4 py-2.5 text-center">{score.caScore ?? '—'}</td><td className="px-4 py-2.5 text-center">{score.examScore ?? '—'}</td><td className="px-4 py-2.5 text-center">{score.totalScore ?? '—'}</td><td className="px-4 py-2.5 text-center font-semibold">{score.grade ?? '—'}</td><td className="px-4 py-2.5 text-gray-500">{score.gradeRemark ?? '—'}</td></tr>)}
                  {scores.filter((score) => score.termId === report.termId).length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No scores found for this report.</td></tr>}
                </tbody>
              </table>
            </div>
            {!isCurrent && <p className="mt-3 text-xs text-gray-400">Previous session · available for download.</p>}
          </Card>
        );
      }) : <Card><p className="py-8 text-center text-sm text-gray-400">No compiled report cards for this session.</p></Card>}

      <Card>
        <h2 className="text-lg font-semibold text-gray-900">Attendance Summary</h2>
        <p className="mt-1 text-sm text-gray-500">{termId ? termName(termId) : 'All academic sessions'}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Attendance rate', `${summary.attendance.rate}%`],
            ['Total sessions', summary.attendance.total],
            ['Present', summary.attendance.present],
            ['Late', summary.attendance.late],
            ['Absent', summary.attendance.absent],
            ['Unmarked', summary.attendance.unmarked],
          ].map(([label, value]) => <div key={label} className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-lg font-bold text-gray-900">{value}</p></div>)}
        </div>
      </Card>
    </div>
  );
}
