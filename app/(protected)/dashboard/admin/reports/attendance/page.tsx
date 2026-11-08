'use client';

import { useState } from 'react';
import { AlertCircle, CalendarDays, Clock3, Users } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Loader } from '@/src/components/ui/Loader';
import { useAdminAttendanceReport } from '@/src/hooks/queries/useAdmin';

function localDateInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function statusClass(status: string) {
  switch (status) {
    case 'PRESENT': return 'bg-emerald-50 text-emerald-700';
    case 'LATE': return 'bg-amber-50 text-amber-700';
    case 'ABSENT': return 'bg-rose-50 text-rose-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export default function AdminAttendanceReportsPage() {
  const [to, setTo] = useState(() => localDateInput(new Date()));
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return localDateInput(date);
  });
  const reportQuery = useAdminAttendanceReport({ from, to });
  const report = reportQuery.data;
  const summary = report?.summary;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-blue-700">Admin reports</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="mt-2 text-sm text-gray-600">Review class sessions and the attendance record for each student.</p>
      </header>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Date range</h2>
            <p className="mt-1 text-sm text-gray-500">Results update when either date changes.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              From
              <input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="text-sm font-medium text-gray-700">
              To
              <input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
          </div>
        </div>
      </Card>

      {summary && (
        <section aria-label="Attendance summary" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Summary label="Class sessions" value={summary.sessions} icon={<CalendarDays size={17} />} />
          <Summary label="Student records" value={summary.students} icon={<Users size={17} />} />
          <Summary label="Present" value={summary.present} tone="text-emerald-700" />
          <Summary label="Late" value={summary.late} tone="text-amber-700" />
          <Summary label="Absent" value={summary.absent} tone="text-rose-700" />
        </section>
      )}

      {reportQuery.isLoading ? (
        <Card><div className="flex h-56 items-center justify-center"><Loader /></div></Card>
      ) : reportQuery.isError ? (
        <Card><div className="flex flex-col items-center py-12 text-center"><AlertCircle className="text-rose-500" /><p className="mt-3 font-semibold text-gray-900">Attendance report could not be loaded</p><p className="mt-1 text-sm text-gray-500">Check your connection and try again.</p><button onClick={() => void reportQuery.refetch()} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Try again</button></div></Card>
      ) : !report?.sessions.length ? (
        <Card><div className="py-14 text-center"><CalendarDays className="mx-auto text-gray-300" size={30} /><p className="mt-3 font-semibold text-gray-800">No attendance sessions in this date range</p><p className="mt-1 text-sm text-gray-500">Choose different dates to view recorded class attendance.</p></div></Card>
      ) : (
        <section className="space-y-4" aria-label="Class attendance sessions">
          {report.sessions.map((session) => (
            <Card key={session.id} className="overflow-hidden p-0">
              <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{session.class.level}{session.label ? ` · ${session.label}` : ''}</h2>
                  <p className="mt-1 text-sm text-gray-500">{new Date(session.date).toLocaleDateString('en-GB', { dateStyle: 'full' })} · {session.term.period} · {session.term.academicYear.label}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5"><Users size={14} />{session.attendances.length} students</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5"><Clock3 size={14} />{session.teacher ? `${session.teacher.firstName} ${session.teacher.lastName}` : 'Teacher not recorded'}</span>
                  <span className={`rounded-full px-3 py-1.5 font-medium ${session.isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{session.isCompleted ? 'Completed' : 'In progress'}</span>
                </div>
              </div>
              {session.attendances.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-white text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Student ID</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Remark</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {session.attendances.map((entry) => <tr key={entry.id}><td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{entry.student.firstName} {entry.student.lastName}</td><td className="whitespace-nowrap px-4 py-3 text-gray-500">{entry.student.studentNumber}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(entry.status)}`}>{entry.status === 'UNMARKED' ? 'Not marked' : entry.status.toLowerCase()}</span></td><td className="px-4 py-3 text-gray-500">{entry.remark || '—'}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              ) : <p className="p-6 text-sm text-gray-500">No students were enrolled when this session was opened.</p>}
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}

function Summary({ label, value, icon, tone = 'text-gray-900' }: { label: string; value: number; icon?: React.ReactNode; tone?: string }) {
  return <Card><p className="flex items-center gap-2 text-xs font-medium text-gray-500">{icon}{label}</p><p className={`mt-2 text-2xl font-bold ${tone}`}>{value.toLocaleString()}</p></Card>;
}
