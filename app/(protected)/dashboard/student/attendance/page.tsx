'use client';

import { StudentDashboardLayout } from '@/src/components/layouts/StudentDashboardLayout';
import { Card } from '@/src/components/ui/Card';

export default function AttendancePage() {
  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">✓ Attendance</h1>
        <Card>
          <p className="text-gray-600">Your attendance records will be displayed here.</p>
        </Card>
      </div>
    </StudentDashboardLayout>
  );
}
