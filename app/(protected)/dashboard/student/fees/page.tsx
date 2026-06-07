'use client';

import { StudentDashboardLayout } from '@/src/components/layouts/StudentDashboardLayout';
import { Card } from '@/src/components/ui/Card';

export default function FeesPage() {
  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">💰 Fees</h1>
        <Card>
          <p className="text-gray-600">Your fees and payment information will be displayed here.</p>
        </Card>
      </div>
    </StudentDashboardLayout>
  );
}
