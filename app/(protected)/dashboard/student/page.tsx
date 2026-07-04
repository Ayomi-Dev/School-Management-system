'use client';

import {
  WelcomeCard,
  PerformanceCard,
  TimetableCard,
  AttendanceCard,
  RecentActivitiesCard,
  EnrolledClassesCard,
} from '@/src/components/dashboards/student/components';
import { Class, StudentProfile, Subject } from '@/src/types';
import { useProfileStore } from '@/src/stores/profileStore';
import { useAuthStore } from '@/src/stores/authStore';
import { useEffect, useState } from 'react';
import { useAcademicYearsList, useExtractEnrollment } from '@/src/hooks/queries/useAcademic';
import { useStudentAcademicSummary } from '@/src/hooks/queries/useAcademic';


const StudentDashboardPage = ( ) => {
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
      const subjects = (enrollmentData?.data?.class.subjects ?? []) as Subject[];
      const selectedClass =( enrollmentData?.data?.class) as Class
      const termId = (enrollmentData?.data?.termId as string) ?? '';
      const { data: summaryData, isLoading: isSummaryLoading, isError: isSummaryError } =
        useStudentAcademicSummary({
          studentId: profile?.id as string, 
          schoolId,
          termId
      });

      const attendance = summaryData?.data.attendance;



  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <WelcomeCard profile={profile as StudentProfile} />
      {/* Main Grid - Performance and Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PerformanceCard subjects={subjects} />
          </div>
          <div>
            <EnrolledClassesCard subjects={subjects} enrolledClass={selectedClass} />
          </div>
      </div>
      {/* Timetable Section */}
      <TimetableCard />
      {/* Attendance and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceCard attendance={attendance}
          isLoading={isSummaryLoading}
          isError={isSummaryError}
        />
        <RecentActivitiesCard />
      </div>

    </div>
  );
};

export default StudentDashboardPage;