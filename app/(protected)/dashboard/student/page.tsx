'use client';

import {
  WelcomeCard,
  PerformanceCard,
  TimetableCard,
  AttendanceCard,
  RecentActivitiesCard,
} from '@/src/components/dashboards/student/components';
import { StudentProfile } from '@/src/types';
import { useProfileStore } from '@/src/stores/profileStore';
import { Loader } from '@/src/components/ui/Loader';


const StudentDashboardPage = ( ) => {
    const { profile } = useProfileStore()

  return (
    <div className="space-y-6">
        {!profile && <Loader />}
        {/* Welcome Section */}
        <WelcomeCard profile={profile as StudentProfile} />
        {/* Main Grid - Performance and Classes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PerformanceCard />
          </div>
          <div>
            {/* <EnrolledClassesCard /> */}
          </div>
        </div>

        {/* Timetable Section */}
        <TimetableCard />

        {/* Attendance and Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AttendanceCard />
          <RecentActivitiesCard />
        </div>

    </div>
  );
};

export default StudentDashboardPage;