'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { useStudentReportSheet, useCompileReportCard } from '@/src/hooks/queries/useReportCard';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';

export default function StudentReportSheetPage() {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const router = useRouter();
  const { data, isLoading, isError } = useStudentReportSheet(classId, studentId);
  const compileMutation = useCompileReportCard(classId);
  const sheet = data?.data;

  if (isLoading) return <div className="flex min-h-80 items-center justify-center"><Loader /></div>;
  if (isError || !sheet) return <Card><p className="py-10 text-center text-sm text-red-600">Could not load this student’s report sheet.</p></Card>;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <button onClick={() => router.push(`/dashboard/teacher/classes/${classId}/report-cards/compile`)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={16} /> Back to report cards
      </button>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{sheet.student.lastName}, {sheet.student.firstName}</h1>
            <p className="mt-1 text-sm text-gray-500">{sheet.student.studentNumber} · {sheet.term.period} — {sheet.term.academicYear}</p>
          </div>
          <Button
            variant="primary"
            className="flex items-center gap-2"
            disabled={compileMutation.isPending || sheet.subjects.length === 0}
            onClick={() => compileMutation.mutate(studentId, { onSuccess: (result) => { if (result) router.push(`/dashboard/teacher/classes/${classId}/report-cards/compile`); } })}
          >
            <FileText size={16} />
            {compileMutation.isPending ? 'Compiling…' : sheet.reportCard ? 'Recompile Report Card' : 'Compile Report Card'}
          </Button>
        </div>
      </Card>
      <Card className="overflow-hidden p-0!">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Report Sheet</h2>
          <p className="mt-1 text-xs text-gray-500">CA, exam, total and grade for every class subject</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-140 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr><th className="px-5 py-3">Subject</th><th className="px-4 py-3 text-center">CA</th><th className="px-4 py-3 text-center">Exam</th><th className="px-4 py-3 text-center">Total</th><th className="px-4 py-3 text-center">Grade</th><th className="px-5 py-3">Remark</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sheet.subjects.map((subject: { id: string; name: string; code: string | null; score: { caScore: number | null; examScore: number | null; totalScore: number | null; grade: string | null; gradeRemark: string | null } | null }) => (
                <tr key={subject.id}>
                  <td className="px-5 py-3 font-medium text-gray-800">{subject.name}{subject.code && <span className="ml-1 text-xs text-gray-400">{subject.code}</span>}</td>
                  <td className="px-4 py-3 text-center">{subject.score?.caScore ?? '—'}</td>
                  <td className="px-4 py-3 text-center">{subject.score?.examScore ?? '—'}</td>
                  <td className="px-4 py-3 text-center font-semibold">{subject.score?.totalScore ?? '—'}</td>
                  <td className="px-4 py-3 text-center font-semibold">{subject.score?.grade ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{subject.score?.gradeRemark ?? '—'}</td>
                </tr>
              ))}
              {sheet.subjects.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No subjects are assigned to this class.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
