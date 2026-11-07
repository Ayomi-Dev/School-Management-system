'use client';

import { useCallback, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function AdminDashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={closeSidebar} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden md:ml-0">
        {/* Topbar */}
        <Topbar
          menuOpen={sidebarOpen}
          onMenuToggle={() => setSidebarOpen((open) => !open)}
          mobileMenuId="admin-mobile-navigation"
        />

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
