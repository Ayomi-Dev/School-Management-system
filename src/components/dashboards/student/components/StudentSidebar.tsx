'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useEffect, useState } from 'react';
import { ChevronDown, GraduationCap } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: NavItem[];
}

const studentNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard/student',
    icon: '🎯',
  },
  {
    label: 'My Profile',
    href: '/dashboard/student/profile',
    icon: '👤',
  },
  {
    label: 'My Subjects',
    href: '/dashboard/student/subjects',
    icon: '📚',
  },
  {
    label: 'Results',
    href: '/dashboard/student/results',
    icon: '📊',
  },
  {
    label: 'Assignments',
    href: '/dashboard/student/assignments',
    icon: '📝',
  },
  // {
  //   label: 'Attendance',
  //   href: '/dashboard/student/attendance',
  //   icon: '✓',
  // },
  {
    label: 'Fees',
    href: '/dashboard/student/fees',
    icon: '💰',
  },
];

export function StudentSidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();
  const { user, school } = useAuth();
  const schoolName = school?.name || 'SchoolHub';
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    onMobileClose();
  }, [pathname, onMobileClose]);

  const toggleExpanded = (label: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpanded(newExpanded);
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const NavLinks = ({ items }: { items: NavItem[] }) => (
    <nav className="space-y-1 px-2">
      {items.map((item) => {
        const active = isActive(item.href);
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expanded.has(item.label);

        return (
          <div key={item.label}>
            {hasChildren ? (
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => toggleExpanded(item.label)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
                <ChevronDown
                  size={18}
                  className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
            ) : (
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">{item.badge}</span>}
              </Link>
            )}

            {hasChildren && isExpanded && (
              <div className="pl-8 space-y-1 mt-1 border-l-2 border-gray-200">
                {item.children?.map((child) => (
                  <Link
                    key={child.label}
                    href={child.href}
                    className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                      isActive(child.href)
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="inline-block mr-2">{child.icon}</span>
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        id="student-mobile-navigation"
        aria-label="Student navigation"
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto z-50 md:z-40 transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <GraduationCap size={22} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">{schoolName}</h1>
              <p className="text-xs text-gray-500">{user?.role ? user?.role.charAt(0).toUpperCase() + user?.role.slice(1).toLowerCase() : ''}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <NavLinks items={studentNavItems} />

        {/* Help Section */}
        <div className="absolute bottom-6 left-6 right-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-gray-900 mb-2">Need Help?</p>
          <p className="text-xs text-gray-600 mb-3">
            Contact Admin for support
          </p>
          <button className="w-full px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors">
            Get Support
          </button>
        </div>
      </aside>
    </>
  );
}
