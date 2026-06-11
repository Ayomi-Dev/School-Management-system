'use client';

import { Card } from '@/src/components/ui/Card';

interface AttendanceRecord {
  subject: string;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

interface AttendanceCardProps {
  records?: AttendanceRecord[];
}

export function AttendanceCard({ records = [] }: AttendanceCardProps) {
  const defaultRecords: AttendanceRecord[] = [
    { subject: 'Mathematics', present: 24, absent: 2, late: 3, percentage: 88 },
    { subject: 'English Language', present: 25, absent: 1, late: 2, percentage: 92 },
    { subject: 'Physics', present: 23, absent: 3, late: 1, percentage: 85 },
    { subject: 'Chemistry', present: 24, absent: 2, late: 1, percentage: 89 },
    { subject: 'Biology', present: 22, absent: 4, late: 1, percentage: 81 },
  ];

  const attendanceRecords = records.length > 0 ? records : defaultRecords;
  const overallPercentage =
    Math.round(
      (attendanceRecords.reduce((acc, r) => acc + r.percentage, 0) / attendanceRecords.length) * 100
    ) / 100;

  const getAttendanceColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Attendance Record</h2>

      <div className="mb-8 p-4 bg-linear-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-700 font-medium mb-1">Overall Attendance</p>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-blue-600">{overallPercentage}%</span>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-linear-to-r from-green-500 to-blue-500 h-3 rounded-full"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
            </div>
          </div>
          <span className="text-2xl">✅</span>
        </div>
      </div>

      <div className="space-y-3">
        {attendanceRecords.map((record) => (
          <div key={record.subject} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-800">{record.subject}</p>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getAttendanceColor(record.percentage)}`}>
                {record.percentage}%
              </span>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-green-700 font-medium">✓ Present: {record.present}</span>
              <span className="text-red-700 font-medium">✗ Absent: {record.absent}</span>
              <span className="text-yellow-700 font-medium">⏰ Late: {record.late}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
