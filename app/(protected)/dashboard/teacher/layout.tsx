'use client';

import React, { useCallback, useState } from 'react'
import { Topbar } from '@/src/components/layouts'
import { TeacherSidebar } from '@/src/components/dashboards/teacher/SideBar'
interface LayoutProps {
    children: React.ReactNode
}
const TeacherDashboardLayout = ( { children } : LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <TeacherSidebar mobileOpen={sidebarOpen} onMobileClose={closeSidebar} />

      {/* Main Content */} 
      <div className="flex flex-col flex-1 overflow-hidden md:ml-0">
        {/* Topbar */}
        <Topbar
          menuOpen={sidebarOpen}
          onMenuToggle={() => setSidebarOpen((open) => !open)}
          mobileMenuId="teacher-mobile-navigation"
        />

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
