'use client';

import { useState } from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Loader } from '@/src/components/ui/Loader';
import { useMyTimetable } from '@/src/hooks/queries/useTimetable';
import type { DayOfWeek, MyTimetableSlot } from '@/src/types/timetable';

const days: Array<{ value: DayOfWeek; label: string }> = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
];

const weekday = days[new Date().getDay() - 1]?.value ?? 'MONDAY';

export function MyTimetableCard({ title = 'Timetable', studentId, audience = 'student' }: {
  title?: string;
  studentId?: string;
  audience?: 'student' | 'teacher' | 'parent';
}) {
  const [day, setDay] = useState<DayOfWeek>(weekday);
  const { data, isLoading, isError } = useMyTimetable(studentId);
  const slots = (data?.slots ?? []).filter((slot) => slot.dayOfWeek === day);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900"><CalendarDays size={19} className="text-blue-600" />{title}</h2>
        <select aria-label="Timetable day" value={day} onChange={(event) => setDay(event.target.value as DayOfWeek)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          {days.map((item) => <option key={item.value} value={item.value}>{item.label}{item.value === weekday ? ' · Today' : ''}</option>)}
        </select>
      </div>

      {isLoading ? <div className="flex min-h-24 items-center justify-center"><Loader /></div> : isError ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">Could not load the timetable.</p>
      ) : slots.length === 0 ? (
        <p className="mt-4 rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">No classes scheduled for {days.find((item) => item.value === day)?.label}.</p>
      ) : (
        <div className="mt-4 divide-y divide-gray-100">
          {slots.map((slot: MyTimetableSlot) => <div key={slot.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex min-w-28 items-center gap-1.5 pt-0.5 text-xs font-semibold text-gray-500"><Clock3 size={14} />{slot.startTime}–{slot.endTime}</div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900">{slot.subject.name}{slot.subject.code ? <span className="ml-2 text-xs font-normal text-gray-400">{slot.subject.code}</span> : null}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {audience === 'teacher' ? `Class ${slot.class?.level ?? '—'}` : `Teacher ${slot.teacher.user.firstName} ${slot.teacher.user.lastName}`}
                {slot.room ? ` · Room ${slot.room}` : ''}
              </p>
            </div>
          </div>)}
        </div>
      )}
    </Card>
  );
}
