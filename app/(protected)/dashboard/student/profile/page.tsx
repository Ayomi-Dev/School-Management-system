"use client"

import { StudentDashboardLayout } from '@/src/components/layouts/StudentDashboardLayout';
import { ProfileCard } from '@/src/components/dashboard/student/ProfileCard';
import { useAuth } from '@/src/hooks/useAuth';
import { useRouter } from 'next/navigation';

const StudentProfile = () => {
    const { user } = useAuth()
    const router = useRouter()
    if(!user){
        router.replace('/auth/refresh')
        return null
    }

  return (
    <StudentDashboardLayout>
        <ProfileCard user={user} />
    </StudentDashboardLayout>
  )
}

export default StudentProfile