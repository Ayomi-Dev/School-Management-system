'use client';

import { StudentDashboardLayout } from '@/src/components/layouts/StudentDashboardLayout';
import { Card } from '@/src/components/ui/Card';
import { useEnrollmentList } from '@/src/hooks/queries/useAcademic';
import { useAuthStore } from '@/src/stores/authStore';
import { useProfileStore } from '@/src/stores/profileStore';
import { useState } from 'react';

export default function SubjectsPage() {
  const { profile } = useProfileStore()
const schoolId = useAuthStore((state) => state.user?.schoolId ?? '');
const [page, setPage] = useState(1);

const { data: enrollmentData, isLoading } = useEnrollmentList(schoolId, page, 20); 
console.log("enrollemnt data:", enrollmentData?.data)
 return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">📚 My Subjects</h1>
      <Card>
        <p className="text-gray-600">Your subjects will be displayed here.</p>
      </Card>
    </div>
  );
}
