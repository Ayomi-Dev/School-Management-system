'use client';

import { useAuth } from '@/src/hooks/useAuth';
import { useLogoutMutation } from '@/src/hooks/queries/useAuth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, LogOut, User, Settings, Bell } from 'lucide-react';

export function Topbar() {
  const { user } = useAuth();
  const router = useRouter();
  const logoutMutation = useLogoutMutation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace('/auth/login');
  };
  const handleProfile = () => {
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
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-8 flex-1">
          <h2 className="text-lg font-semibold text-gray-900">
            Welcome, {user?.userCode}
          </h2>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 cursor-pointer">
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
              <div className="text-left">
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
