'use client';

import { useLinkedStudents } from '@/src/hooks/queries/useParent';
import { Loader } from '@/src/components/ui/Loader';
import {
  
  AlertCircle,
  Users,
} from 'lucide-react';
import { StudentCard } from './components/studentCard';




// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ParentDashboard() {
  const { data: students , isLoading, isError } = useLinkedStudents();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-red-500">
        <AlertCircle size={36} />
        <p className="text-sm text-gray-600">Could not load your children. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Children</h1>
        <p className="text-gray-500 mt-1 text-sm">
          View academic performance, attendance, and report cards for each child.
        </p>
      </div>

      {students?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Users size={28} className="text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">No students linked yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Contact your school admin to have your child linked to your account.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {students?.map((student, i) => (
            <StudentCard key={student.studentId} student={student} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
