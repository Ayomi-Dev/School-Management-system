'use client';

import { Loader } from '@/src/components/ui/Loader';
import { Card } from '@/src/components/ui/Card';
import { AlertCircle } from 'lucide-react';
import {
  useTeacherOverview
} from '@/src/hooks/queries/useTeacher';
import { ClassTeacherSection, SubjectTeacherSection } from './components/overviiew';



export default function TeacherDashboardPage() {
  const { data, isLoading, error } = useTeacherOverview();
  const overview     = data?.data;
  const classSection = overview?.classSection;
  const subSection   = overview?.subjectSection;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-red-600 font-medium">Could not load overview.</p>
          <p className="text-sm text-gray-500 mt-1">
            {(error as any)?.response?.data?.error ?? 'Please try again.'}
          </p>
        </div>
      </Card>
    );
  }
  const hasNothing = !classSection && !subSection;

  return (
    <div className="space-y-8 w-full">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good{' '}
          {new Date().getHours() < 12
            ? 'morning'
            : new Date().getHours() < 17
            ? 'afternoon'
            : 'evening'}
          , {overview.teacher.firstName} 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year:    'numeric',
            month:   'long',
            day:     'numeric',
          })}
        </p>
      </div>

      {/* Class teacher section — shown first, primary role */}
      {classSection && <ClassTeacherSection section={classSection} />}

      {/* Divider between sections only when both exist */}
      {classSection && subSection && (
        <hr className="border-gray-200" />
      )}

      {/* Subject teacher section */}
      {subSection && <SubjectTeacherSection section={subSection} />}

      {/* Unassigned empty state */}
      {hasNothing && (
        <Card>
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center
                            justify-center mx-auto mb-3">
              <AlertCircle size={24} className="text-amber-500" />
            </div>
            <p className="font-semibold text-gray-800 mb-1">No assignments yet</p>
            <p className="text-sm text-gray-500">
              Contact your admin to be assigned to a class or subject.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
