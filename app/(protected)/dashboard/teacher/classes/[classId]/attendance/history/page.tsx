'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/src/components/ui/Card';
import { Loader } from '@/src/components/ui/Loader';
import { Button } from '@/src/components/ui/Button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAttendanceHistory } from '@/src/hooks/queries/useAttendance';

export default function AttendanceHistoryPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading } = useAttendanceHistory({
    classId,
    page,
    limit: 20,
    from: from || undefined,
    to: to || undefined,
  });

  const sessions = data?.data ?? [];
  const meta = data?.meta;

  const goToDay = (date: string) => {
    // Reuses the Mark Attendance page with a date param so the same roster
    // UI doubles as a "view/edit past day" screen — no separate detail page.
    const formatted = new Date(date).toISOString().slice(0, 10);
    router.push(`/dashboard/teacher/classes/${classId}/attendance/mark?date=${formatted}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
        <p className="text-gray-600 mt-1">Past attendance records for this class</p>
      </div>

      {/* Date filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(from || to) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFrom('');
                setTo('');
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader />
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Calendar className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-gray-600">No attendance records found.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-01 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {sessions.map((session) => (
              <button
                key={session.sessionId}
                onClick={() => goToDay(session.date)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(session.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {session.totalStudents} student{session.totalStudents !== 1 ? 's' : ''}
                    {!session.isCompleted && (
                      <span className="text-amber-600 font-medium"> · Incomplete</span>
                    )}
                  </p>
                </div>

                {/* Status breakdown pills */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium">
                    {session.counts.PRESENT} Present
                  </span>
                  {session.counts.LATE > 0 && (
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full font-medium">
                      {session.counts.LATE} Late
                    </span>
                  )}
                  {session.counts.ABSENT > 0 && (
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full font-medium">
                      {session.counts.ABSENT} Absent
                    </span>
                  )}
                  {session.counts.UNMARKED > 0 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full font-medium">
                      {session.counts.UNMARKED} Unmarked
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Pagination */}
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
