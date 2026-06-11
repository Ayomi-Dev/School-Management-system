import { StudentDashboardLayout } from '@/src/components/layouts/StudentDashboardLayout'
import React from 'react'

const StudentLayout = ( { children }: { children: React.ReactNode}) => {
  return (
    <StudentDashboardLayout>
        { children }
    </StudentDashboardLayout>
  )
}

export default StudentLayout