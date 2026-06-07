'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { DashboardLayout } from '@/src/components/layouts/DashboardLayout';
import {
  WelcomeCard,
  PerformanceCard,
  EnrolledClassesCard,
  TimetableCard,
  AttendanceCard,
  RecentActivitiesCard,
  ProfileCard,
} from '@/src/components/dashboard/student';

const StudentDashboard = () => {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    router.replace('/auth/refresh');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <WelcomeCard user={user} />

        {/* Main Grid - Performance and Classes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PerformanceCard />
          </div>
          <div>
            <EnrolledClassesCard />
          </div>
        </div>

        {/* Timetable Section */}
        <TimetableCard />

        {/* Attendance and Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AttendanceCard />
          <RecentActivitiesCard />
        </div>

        {/* Profile Section */}
        <ProfileCard user={user} />
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;