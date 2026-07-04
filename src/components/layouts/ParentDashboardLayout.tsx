'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { useLinkedStudents } from '@/src/hooks/queries/useParent';
import { Topbar } from './Topbar';

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV = [
  {
    href:  '/dashboard/parent',
    label: 'Dashboard',
    icon:  LayoutDashboard,
  },
  {
    href:  '/dashboard/parent/students',
    label: 'My Children',
    icon:  Users,
  },
] as const;

// ─── Avatar colours — rotate per initial ─────────────────────────────────────

const GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-teal-500 to-emerald-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
];
function avatarGradient(name: string) {
  const code = name.charCodeAt(0) ?? 0;
  return GRADIENTS[code % GRADIENTS.length];
}

// ─── Sidebar content (shared between desktop and mobile drawer) ───────────────

function SidebarContent({
  pathname,
  onNavClick,
}: {
  pathname: string;
  onNavClick?: () => void;
}) {
  const { data: students = [] } = useLinkedStudents();

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">SchoolHub</p>
            <p className="text-blue-200 text-[11px]">Parent Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

        {/* Children quick-links */}
        {students.length > 0 && (
          <div className="pt-4">
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-blue-300">
              My Children
            </p>
            {students.map((s, i) => {
              const href    = `/dashboard/parent/students/${s.studentId}`;
              const active  = pathname.startsWith(href);
              const initials = `${s.firstName[0]}${s.lastName[0]}`.toUpperCase();
              const grad    = avatarGradient(s.firstName);
              return (
                <Link
                  key={s.studentId}
                  href={href}
                  onClick={onNavClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg bg-linear-to-br ${grad} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}
                  >
                    {initials}
                  </div>
                  <span className="flex-1 truncate">{s.firstName} {s.lastName}</span>
                  {s.currentClass && (
                    <span className="text-[10px] text-blue-300 shrink-0">
                      {s.currentClass.level}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Notifications + sign out */}
      <div className="px-3 pb-5 space-y-0.5 border-t border-white/10 pt-3">
        <Link
          href="/parent/notifications"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-blue-100 hover:bg-white/10 hover:text-white transition-all"
        >
          <Bell size={17} />
          Notifications
        </Link>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-blue-100 hover:bg-red-500/20 hover:text-red-200 transition-all"
          onClick={() => {/* call your signOut handler */}}
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </div>
  );
}



// ─── Layout ───────────────────────────────────────────────────────────────────

export function ParentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 bg-linear-to-b from-blue-700 to-blue-800 fixed inset-y-0 left-0 z-40 shadow-xl">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-60">
        {/* Mobile topbar */}
        <Topbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 lg:px-8 py-6 ">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
