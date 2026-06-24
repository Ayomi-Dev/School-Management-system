'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';
import { Check, X, Clock, Save } from 'lucide-react';
import {
  useDailyRoster,
  useMarkAttendance,
} from '@/src/hooks/queries/useAttendance';
import { AttendanceStatus } from '@/src/types';
import { RosterEntry } from '@/src/utils/teacher';

const STATUS_OPTIONS: { value: Exclude<AttendanceStatus, 'UNMARKED'>; label: string; icon: React.ReactNode; activeClass: string }[] = [
  { value: 'PRESENT', label: 'Present', icon: <Check size={15} />, activeClass: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'LATE', label: 'Late', icon: <Clock size={15} />, activeClass: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'ABSENT', label: 'Absent', icon: <X size={15} />, activeClass: 'bg-red-100 text-red-700 border-red-300' },
];

export default function MarkAttendancePage() {
  const { classId } = useParams<{ classId: string }>();
  const searchParams = useSearchParams();
  // Present when navigated here from Attendance History to view/edit a past
  // day. Absent (undefined) means "today" — the roster endpoint defaults to
  // today's date server-side when no date param is sent.
  const dateParam = searchParams.get('date') ?? undefined;

  const { data: attendanceData, isLoading, error } = useDailyRoster(classId, dateParam);
  const { mutate: saveMutate, isPending: isSaving } = useMarkAttendance(classId);

  // Local draft state: studentId -> { status, remark }. Seeded from the
  // fetched roster, then edited client-side until "Save" is pressed — this
  // avoids firing a network request per tap, which would be both slow and
  // expensive for a class of 30+ students.
  const [draft, setDraft] = useState<Record<string, { status: AttendanceStatus; remark: string }>>(
    {},
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (attendanceData?.data.roster) {
      const seeded: typeof draft = {};
      attendanceData.data.roster.forEach((entry) => {
        seeded[entry.studentId] = { status: entry.status, remark: entry.remark ?? '' };
      });
      setDraft(seeded);
    }
  }, [attendanceData]);

  const roster: RosterEntry[] = attendanceData?.data.roster ?? [];
  const sessionId = attendanceData?.data.session.id;

  const unmarkedCount = useMemo(
    () => Object.values(draft).filter((d) => d.status === 'UNMARKED').length,
    [draft],
  );

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setDraft((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const setRemark = (studentId: string, remark: string) => {
    setDraft((prev) => ({ ...prev, [studentId]: { ...prev[studentId], remark } }));
  };

  const markAllPresent = () => { //marks all students in the class present
    setDraft((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], status: 'PRESENT' };
      });
      return next;
    });
  };

  const handleSave = () => {  //saves attendance data
    if (!sessionId) return;
    setSaveMessage(null);

    const entries = roster
      .filter((entry) => draft[entry.studentId]?.status !== 'UNMARKED')
      .map((entry) => ({
        attendanceId: entry.attendanceId,
        status: draft[entry.studentId].status as 'PRESENT' | 'ABSENT' | 'LATE',
        remark: draft[entry.studentId].remark || undefined,
      }));

    if (entries.length === 0) {
      setSaveMessage('Mark at least one student before saving.');
      return;
    }

    saveMutate(
      { sessionId, entries },
      {
        onSuccess: (res) => setSaveMessage(res.message),
        onError: (err: any) =>
          setSaveMessage(err?.response?.data?.error ?? 'Could not save attendance.'),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-red-600 font-medium">Could not load today's roster.</p>
          <p className="text-sm text-gray-500 mt-1">
            {(error as any)?.response?.data?.error ?? 'Please try again.'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
          <p className="text-gray-600 mt-1">
            {attendanceData?.data.session.date
              ? new Date(attendanceData.data.session.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Today'}
            {' · '}
            {roster.length} student{roster.length !== 1 ? 's' : ''}
            {unmarkedCount > 0 && (
              <span className="text-amber-600 font-medium"> · {unmarkedCount} unmarked</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={markAllPresent}>
            Mark All Present
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </div>

      {saveMessage && (
        <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          {saveMessage}
        </div>
      )}

      {/* Roster */}
      {roster.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">No students enrolled in this class yet.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-01 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {roster.map((entry) => {
              const current = draft[entry.studentId]?.status ?? 'UNMARKED';
              return (
                <div
                  key={entry.studentId}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {entry.firstName} {entry.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{entry.admissionNumber}</p>
                  </div>

                  {/* Status buttons */}
                  <div className="flex items-center gap-1.5">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(entry.studentId, opt.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          current === opt.value
                            ? opt.activeClass
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Remark — only meaningfully used for Late/Absent but left open */}
                  <input
                    type="text"
                    placeholder="Remark (optional)"
                    value={draft[entry.studentId]?.remark ?? ''}
                    onChange={(e) => setRemark(entry.studentId, e.target.value)}
                    className="w-full sm:w-44 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
