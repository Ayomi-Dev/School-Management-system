'use client';

import { Card } from '@/src/components/ui/Card';

interface TimetableSlot {
  day: string;
  time: string;
  subject: string;
  classroom: string;
  teacher?: string;
}

interface TimetableCardProps {
  slots?: TimetableSlot[];
}

export function TimetableCard({ slots = [] }: TimetableCardProps) {
  const defaultSlots: TimetableSlot[] = [
    { day: 'Monday', time: '8:00 - 9:00 AM', subject: 'Mathematics', classroom: 'Room 101', teacher: 'Mr. Johnson' },
    { day: 'Monday', time: '9:00 - 10:00 AM', subject: 'English Language', classroom: 'Room 102', teacher: 'Mrs. Smith' },
    { day: 'Tuesday', time: '8:00 - 9:00 AM', subject: 'Physics', classroom: 'Lab 1', teacher: 'Mr. Brown' },
    { day: 'Tuesday', time: '10:00 - 11:00 AM', subject: 'Chemistry', classroom: 'Lab 2', teacher: 'Dr. Wilson' },
    { day: 'Wednesday', time: '8:00 - 9:00 AM', subject: 'Biology', classroom: 'Lab 3', teacher: 'Miss Davis' },
    { day: 'Thursday', time: '2:00 - 3:00 PM', subject: 'Economics', classroom: 'Room 105', teacher: 'Mr. Taylor' },
  ];

  const timetableSlots = slots.length > 0 ? slots : defaultSlots;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const currentDay = days[new Date().getDay() - 1] || 'Monday';

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📅 Timetable</h2>

      <div className="space-y-3">
        {timetableSlots.map((slot, idx) => {
          const isToday = slot.day === currentDay;
          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border-2 transition ${
                isToday
                  ? 'bg-blue-50 border-blue-400'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      isToday ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'
                    }`}>
                      {slot.day}
                    </span>
                    <span className="text-sm font-medium text-gray-600">{slot.time}</span>
                  </div>
                  <p className="font-semibold text-lg text-gray-800">{slot.subject}</p>
                  <p className="text-sm text-gray-600">{slot.teacher && `Teacher: ${slot.teacher}`}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{slot.classroom}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
