'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/src/components/ui/Card';
import { Loader } from '@/src/components/ui/Loader';
import { Button } from '@/src/components/ui/Button';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { useScoreHistory } from '@/src/hooks/queries/useScores';

export default function ScoreHistoryPage() {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useScoreHistory({ classId, subjectId, page, limit: 20 });
  const records = data?.data ?? [];
  const meta = data?.meta; 

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Score History</h1>
        <p className="text-gray-600 mt-1">Past scores recorded for this subject</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader />
        </div>
      ) : records.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <History className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-gray-600">No score history yet.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-0! overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 font-semibold">Student</th>
                <th className="px-5 py-3 font-semibold">Term</th>
                <th className="px-5 py-3 font-semibold">CA</th>
                <th className="px-5 py-3 font-semibold">Exam</th>
                <th className="px-5 py-3 font-semibold">Total</th>
                <th className="px-5 py-3 font-semibold">Grade</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">
                      {record.student.firstName} {record.student.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{record.student.studentNumber}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{record.term.period}</td>
                  <td className="px-5 py-3 text-gray-700">{record.caScore ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-700">{record.examScore ?? '—'}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {record.totalScore ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    {record.grade ? (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                        {record.grade}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {record.isPublished ? (
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

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {meta.page} of {meta.totalPages} &middot; {meta.total} total records
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
