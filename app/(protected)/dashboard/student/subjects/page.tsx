'use client';

import { StudentDashboardLayout } from '@/src/components/layouts/StudentDashboardLayout';
import { Card } from '@/src/components/ui/Card';
import {
  useAcademicYearsList,
  useExtractEnrollment,
} from '@/src/hooks/queries/useAcademic';
import { useAuthStore } from '@/src/stores/authStore';
import { useProfileStore } from '@/src/stores/profileStore';
import { useEffect, useState } from 'react';

export default function SubjectsPage() {
  const { profile } = useProfileStore();
  const schoolId = useAuthStore((state) => state.user?.schoolId ?? '');

  const [yearId, setYearId] = useState<string>('');

  const { data: yearsData, isLoading: isYearsLoading } =
    useAcademicYearsList(schoolId);
  const years = yearsData?.data ?? [];

  // Auto-selects the current academic year once years load
  useEffect(() => {
    if (!yearId && years.length > 0) {
      const currentYear = years.find((yr) => yr.isCurrent) ?? years[0];
      if (currentYear) setYearId(currentYear.id);
    }
  }, [years, yearId]);

  const { data: enrollmentData, isLoading: isSubjectsLoading, isError } = useExtractEnrollment(profile?.id as string, yearId);

  // Flatten defensively in case the API ever returns nested arrays
  const subjects = enrollmentData?.data.subjects ?? [];
  const selectedClass = enrollmentData?.class;
  console.log("subjects:", subjects)

  const isLoading = isYearsLoading || (isSubjectsLoading && !!yearId);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">📚 My Subjects</h1>

      <div className="flex items-center gap-3">
        <label htmlFor="academicYear" className="text-sm font-medium text-gray-700">
          Academic Year
        </label>
        <select
          id="academicYear"
          value={yearId}
          onChange={(e) => setYearId(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          disabled={isYearsLoading || years.length === 0}
        >
          {years.length === 0 && <option value="">No academic years found</option>}
          {years.map((yr) => (
            <option key={yr.id} value={yr.id}>
              {yr.label}
              {yr.isCurrent ? ' (Current)' : ''}
            </option>
          ))}
        </select>
      </div>

      <Card>
        {isLoading && (
          <p className="text-gray-500">Loading your subjects…</p>
        )}

        {!isLoading && isError && (
          <p className="text-red-600">
            Couldn't load your subjects. Please try again.
          </p>
        )}

        {!isLoading && !isError && yearId && subjects.length === 0 && (
          <p className="text-gray-600">
            No subjects found for this academic year.
          </p>
        )}

        {!isLoading && !isError && subjects.length > 0 && (
          <div className="space-y-3">
            {selectedClass && (
              <p className="text-sm text-gray-500">
                Class: <span className="font-medium text-gray-800">{selectedClass.name}</span>
              </p>
            )}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {subjects.map((subject:any) => (
                <li
                  key={subject.id}
                  className="rounded-md border border-gray-200 px-4 py-2 text-gray-700"
                >
                  {subject.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}