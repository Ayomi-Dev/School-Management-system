'use client';

import { StudentDashboardLayout } from '@/src/components/layouts/StudentDashboardLayout';
import { Card } from '@/src/components/ui/Card';
import { useProfileStore } from '@/src/stores/profileStore';

export default function SubjectsPage() {
  const { profile } = useProfileStore()
  return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">📚 My Subjects</h1>
        <Card>
          <p className="text-gray-600">Your courses will be displayed here.</p>
        </Card>
      </div>
  );
}
