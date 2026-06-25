'use client';

import { Card } from '@/src/components/ui/Card';
import { Class, Subject } from '@/src/types';
import { currentSession, getCurrentTerm } from '@/src/utils/userCode';

interface EnrolledClassesCardProps {
  enrolledClass: Class;
  subjects: Subject[];
}

export function EnrolledClassesCard({subjects, enrolledClass}: EnrolledClassesCardProps) {
  const year = currentSession();
  const term = getCurrentTerm()

  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">📚 Enrollment</h2>
      <div className="flex justify-between flex-wrap">
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Class</h3>
          <div className="space-y-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{enrolledClass?.level}</span>
          </div>
        </div>
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Term</h3>
          <div className="space-y-3">
            <span className="px-3 py-1 bg-orange-100 text-blue-800 rounded-full text-sm font-medium">{term}</span>
          </div>
        </div>
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Session</h3>
          <div className="space-y-3">
            <span className="px-3 py-1 bg-red-100 text-blue-800 rounded-full text-sm font-medium">{year}</span>
          </div>
        </div>

      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Subjects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subjects?.map((subject: Subject) => (
            <div key={subject.id} className="flex items-center gap-3 bg-linear-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <span className="text-lg">📖</span>
              <span className="font-medium text-gray-800">{subject.name}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
