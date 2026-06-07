'use client';

import { DashboardLayout } from '@/src/components/layouts/DashboardLayout';
import { Card } from '@/src/components/ui/Card';

export default function CoursesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">📚 My Courses</h1>
        <Card>
          <p className="text-gray-600">Your courses will be displayed here.</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
