"use client"

import { StudentDashboardLayout } from '@/src/components/layouts/StudentDashboardLayout';
import { ProfileCard } from '@/src/components/dashboards/student/components/ProfileCard';
import { useProfileStore } from '@/src/stores/profileStore';
import { useRouter } from 'next/navigation';
import { StudentProfile } from '@/src/types/api';
import { Loader } from '@/src/components/ui/Loader';

const StudentProfilePage = () => {
  const { profile } = useProfileStore()
  if(!profile){
    return <Loader />
  }

  return (
    <ProfileCard profile={profile as StudentProfile} />
  )
}

export default StudentProfilePage;