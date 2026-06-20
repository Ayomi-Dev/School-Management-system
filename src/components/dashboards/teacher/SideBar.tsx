'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { buildClassNavSections, NavItem, NavSection, personalNavSection } from '@/src/utils/teacher';
import { useMyClass } from '@/src/hooks/queries/useUsers';

export function TeacherSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // A teacher has exactly one class assignment (TeacherClassAssignment
  // is 1:1), so we fetch it directly on mount instead of receiving it as a
  // prop. No class switcher needed — there's nothing to switch between.
  const { data: assignedClass, isLoading } = useMyClass();
  const classAssignedToTeacher = assignedClass?.data

  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (label: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const sections: NavSection[] = assignedClass
    ? [...buildClassNavSections(classAssignedToTeacher?.classAssignment.classId as string), personalNavSection]
    : [personalNavSection];

  // ─── NAV LINKS ──────────────────────────────────────────────────────────────

  const NavLinks = ({ items }: { items: NavItem[] }) => (
    <nav className="space-y-0.5 px-2">
      {items.map((item) => {
        const active = isActive(item.href);
        const hasChildren = !!item.children?.length;
        const isExpanded = expanded.has(item.label);

        return (
          <div key={item.label}>
            {/* Parent row */}
            <div
              className={`flex items-center rounded-lg transition-colors ${
                active
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {/* Link — separate from the chevron so both are individually clickable */}
              <Link
                href={item.href}
                className="flex items-center gap-3 flex-1 px-4 py-2.5"
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>

              {/* Chevron — only toggles expand, does not navigate */}
              {hasChildren && (
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className="pr-4 pl-1 py-2.5 text-gray-400 hover:text-gray-700"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
              )}
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
              <div className="pl-4 mt-0.5 mb-1 space-y-0.5 border-l-2 border-gray-200 ml-6">
                {item.children!.map((child) => (
                  <Link
                    key={child.label}
                    href={child.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive(child.href)
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm leading-none">{child.icon}</span>
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

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 hover:bg-gray-100 rounded-lg"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar shell */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden z-40 transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo + active class */}
        <div className="shrink-0 p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">SchoolHub</h1>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Assigned class indicator — replaces the old multi-class switcher
              since a teacher now has exactly one class. */}
          {isLoading ? (
            <div className="mt-3 h-8 bg-gray-100 rounded-lg animate-pulse" />
          ) : assignedClass ? (
            <div className="mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold">
                {classAssignedToTeacher?.classAssignment.isClassTeacher ? 'Class Teacher' : 'Assigned Class'}
              </p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {classAssignedToTeacher?.classAssignment.class.level}
              </p>
            </div>
          ) : null}
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pb-36">
          {isLoading ? (
            <div className="px-6 py-4 space-y-3">
              <div className="h-4 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-4/6" />
            </div>
          ) : (
            <>
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="px-6 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    {section.title}
                  </p>
                  <NavLinks items={section.items} />
                </div>
              ))}

              {!assignedClass && (
                <div className="px-6 py-4 text-center">
                  <p className="text-sm text-gray-400">
                    No class assigned yet. Contact your admin.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Help card */}
        <div className="shrink-0 p-4 border-t border-gray-100">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm font-medium text-gray-900 mb-1">Need Help?</p>
            <p className="text-xs text-gray-600 mb-3">
              Reach out to admin for support
            </p>
            <button className="w-full px-3 py-2 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors">
              Get Support
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
