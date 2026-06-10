// app/(protected)/dashboard/page.tsx
'use client';

import { useAuthStore } from '@/src/stores/authStore';
import { useProfileStore } from '@/src/stores/profileStore';
import { Loader } from '@/src/components/ui/Loader';
import StudentDashboard from '@/src/components/dashboards/student/StudentDashboard';
import { StudentProfile } from '@/src/types';

export default function DashboardPage() {
    console.log("dashboard page loaded")
  const user = useAuthStore((s) => s.user);
  const { profile, isLoadingProfile } = useProfileStore();
  console.log(profile)
  
    if (!profile || profile.user?.role !== 'STUDENT') return <Loader />;


  return (
    <div>
      {/* <h1>Welcome back, {user?.firstName}</h1>
      <p>Role: {user?.role}</p> */}

      {/* Narrow by role and render the right dashboard */}
      {user?.role === 'STUDENT' && <StudentDashboard profile={profile as StudentProfile} />}
      {/* {user?.role === 'TEACHER' && <TeacherDashboard profile={profile} />} */}
      {/* {user?.role === 'ADMIN' && <AdminDashboard profile={profile} />} */}
      {/* {user?.role === 'PARENT' && <ParentDashboard profile={profile} />} */}
      {/* {user?.role === 'BURSAR' && <BursarDashboard profile={profile} />} */}
    </div>
  );
}