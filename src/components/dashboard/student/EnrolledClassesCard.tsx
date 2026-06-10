'use client';

import { Card } from '@/src/components/ui/Card';
import { useSubjectsList } from '@/src/hooks/queries/useAdmin';
import { Class } from '@/src/types';
import { useMemo } from 'react';

interface EnrolledClassesCardProps {
  enrolledClasses?: Class[];
  subjects?: string[];
}

export function EnrolledClassesCard({ enrolledClasses = [], subjects = [] }: EnrolledClassesCardProps) {
  const { data: subjctsData } = useSubjectsList()
  // const enrollments = useMemo(() => enrollmentData?.data || [], [enrollmentData])
  const defaultClasses = [
    { id: '1', name: 'Senior Secondary 1 (SS1)', level: 'SS1', capacity: 45 },
    { id: '2', name: 'Science Stream', level: 'SS1', capacity: 45 },
  ];

  const defaultSubjects = [
    'Mathematics',
    'English Language',
    'Physics',
    'Chemistry',
    'Biology',
    'Economics',
    'Government',
    'Literature-in-English',
  ];

  const classes = enrolledClasses.length > 0 ? enrolledClasses : defaultClasses;
  const subjectList = subjects.length > 0 ? subjects : defaultSubjects;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📚 Enrolled Classes & Subjects</h2>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Classes</h3>
        <div className="space-y-3">
          {classes.map((cls) => (
            <div key={cls.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
              <div>
                <p className="font-semibold text-gray-800">{cls.name}</p>
                <p className="text-sm text-gray-600">Capacity: {cls.capacity || 'N/A'} students</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{cls.level}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Subjects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subjectList.map((subject) => (
            <div key={subject} className="flex items-center gap-3 p-3 bg-linear-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <span className="text-lg">📖</span>
              <span className="font-medium text-gray-800">{subject}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
