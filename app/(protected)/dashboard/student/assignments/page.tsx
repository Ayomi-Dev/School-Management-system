'use client';

import { Card } from '@/src/components/ui/Card';

export default function AssignmentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">📝 Assignments</h1>
      <Card>
        <p className="text-gray-600">Your assignments will be displayed here.</p>
      </Card>
    </div>
  );
}
