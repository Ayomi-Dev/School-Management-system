import React from 'react'
import { Topbar } from '@/src/components/layouts'
import { TeacherSidebar } from '@/src/components/dashboards/teacher/SideBar'
interface LayoutProps {
    children: React.ReactNode
}
const TeacherDashboardLayout = ( { children } : LayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <TeacherSidebar />

      {/* Main Content */} 
      <div className="flex flex-col flex-1 overflow-hidden md:ml-0">
        {/* Topbar */}
        <Topbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default TeacherDashboardLayout;