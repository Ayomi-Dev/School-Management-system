'use client';

import { useProfileStore } from '@/src/stores/profileStore';
import { StudentSidebar } from '../dashboards/student/components/StudentSidebar';
import { Topbar } from './Topbar';

interface StudentDashboardLayoutProps {
  children: React.ReactNode;
}

export function StudentDashboardLayout({ children }: StudentDashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <StudentSidebar />

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
  );
}
