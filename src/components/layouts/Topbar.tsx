'use client';

import { useAuth } from '@/src/hooks/useAuth';
import { useLogoutMutation } from '@/src/hooks/queries/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, LogOut, User, Settings, Bell, Menu, X } from 'lucide-react';

export function Topbar({
  menuOpen = false,
  onMenuToggle,
  mobileMenuId,
  mobileMenuBreakpoint = 'md',
}: {
  menuOpen?: boolean;
  onMenuToggle?: () => void;
  mobileMenuId?: string;
  mobileMenuBreakpoint?: 'md' | 'lg';
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const logoutMutation = useLogoutMutation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setIsProfileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace('/auth/login');
  };
  const handleProfile = () => {
    setIsProfileOpen(false);
    router.push(`/dashboard/${user?.role?.toLocaleLowerCase()}/profile`);
  };

  const getInitials = () => {
    return `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
  };

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        {/* Left Section */}
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-8">
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls={mobileMenuId}
              className={`${mobileMenuBreakpoint === 'lg' ? 'lg:hidden' : 'md:hidden'} inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
            >
              {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          )}
          <h2 className="min-w-0 truncate text-base font-semibold text-gray-900 sm:text-lg">
            Welcome, {user?.userCode}
          </h2>
        </div>

        {/* Right Section */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{getInitials()}</span>
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    statusColors[user?.status as keyof typeof statusColors] || statusColors.ACTIVE
                  }`}
                >
                  {user?.status}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-600 transition-transform ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  <p className="text-xs text-gray-500 mt-1">{user?.role}</p>
                </div>

                <div className="py-2">
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={handleProfile}
                  >
                    <User size={16} />
                    My Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                    <Settings size={16} />
                    Settings
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 disabled:opacity-50 cursor-pointer"
                >
                  <LogOut size={16} />
                  {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
