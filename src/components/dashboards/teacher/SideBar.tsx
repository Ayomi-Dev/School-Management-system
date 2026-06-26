'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import {
  buildClassNavSections,
  buildSubjectTeacherNavSections,
  NavItem,
  NavSection,
  personalNavSection,
} from '@/src/utils/teacher';
import { useMyClass } from '@/src/hooks/queries/useTeacher';
import { useMySubjectAssignments } from '@/src/hooks/queries/useTeacher';

// ─── teacher type detection ───────────────────────────────────────────────────
//
// Three possible states after both queries resolve:
//
//   CLASS TEACHER    — assignedClass is non-null.
//                      Renders the full class management nav.
//
//   SUBJECT TEACHER  — assignedClass is null but subjectAssignments has
//                      at least one class. Renders one section per class
//                      with their subjects + score/assignment links.
//
//   UNASSIGNED       — assignedClass is null AND no subject assignments.
//                      Renders only the personal section with a clear
//                      "no assignments yet" message. No nav items that
//                      depend on a classId are shown — prevents undefined
//                      classId from reaching any page.

export function TeacherSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const { data: assignedClass,       isLoading: loadingClass   } = useMyClass();
  const { data: subjectAssignments,  isLoading: loadingSubjects } = useMySubjectAssignments();

  const [isOpen,   setIsOpen]   = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const isLoading = loadingClass || loadingSubjects;

  const toggleExpanded = (label: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  // Determine teacher type and build nav sections accordingly.
  const subjectClasses = subjectAssignments?.data.classes ?? [];

  let teacherType: 'class' | 'subject' | 'unassigned' = 'unassigned';
  if (assignedClass?.data?.classAssignment?.isClassTeacher) {
    teacherType = 'class';
  } else if (subjectClasses.length > 0) {
    teacherType = 'subject';
  }

  const sections: NavSection[] = (() => {
    switch (teacherType) {
      case 'class':
        return [
          ...buildClassNavSections(assignedClass!?.data?.classAssignment?.classId),
          personalNavSection,
        ];
      case 'subject':
        return [
          ...buildSubjectTeacherNavSections(subjectClasses),
          personalNavSection,
        ];
      case 'unassigned':
        return [personalNavSection];
    }
  })();

  // ── nav links ─────────────────────────────────────────────────────────────

  const NavLinks = ({ items }: { items: NavItem[] }) => (
    <nav className="space-y-0.5 px-2">
      {items.map((item) => {
        const active     = isActive(item.href);
        const hasChildren = !!item.children?.length;
        const isExpanded  = expanded.has(item.label);

        return (
          <div key={item.label}>
            <div
              className={`flex items-center rounded-lg transition-colors ${
                active
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
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

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 hover:bg-gray-100 rounded-lg"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r
                    border-gray-200 flex flex-col overflow-hidden z-40 transition-transform ${
                      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
      >
        {/* Logo + identity header */}
        <div className="shrink-0 p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-emerald-700
                            rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">SchoolHub</h1>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Context indicator — what this teacher is assigned to */}
          {isLoading ? (
            <div className="mt-3 h-8 bg-gray-100 rounded-lg animate-pulse" />
          ) : teacherType === 'class' && assignedClass ? (
            // Class teacher — show their assigned class
            <div className="mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold">
                {assignedClass?.data?.classAssignment?.isClassTeacher ? 'Class Teacher' : 'Assigned Class'}
              </p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {assignedClass?.data?.classAssignment?.class.level} 
              </p>
            </div>
          ) : teacherType === 'subject' ? (
            // Subject teacher — show how many classes they teach across
            <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-[10px] uppercase tracking-widest text-blue-600 font-semibold">
                Subject Teacher
              </p>
              <p className="text-sm font-medium text-gray-900">
                {subjectClasses?.length} class{subjectClasses?.length !== 1 ? 'es' : ''}
                {' · '}
                {subjectClasses.reduce((n, c) => n + c.subjects.length, 0)} subject
                {subjectClasses.reduce((n, c) => n + c.subjects.length, 0) !== 1 ? 's' : ''}
              </p>
            </div>
          ) : null /* unassigned — no indicator shown, empty state in nav covers it */}
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pb-36">
          {isLoading ? (
            // Skeleton — avoids layout shift while both queries resolve
            <div className="px-6 py-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-4 bg-gray-100 rounded animate-pulse"
                  style={{ width: `${60 + i * 8}%` }}
                />
              ))}
            </div>
          ) : (
            <>
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="px-6 mb-1 text-[10px] font-semibold uppercase
                                tracking-widest text-gray-400">
                    {section.title}
                  </p>
                  <NavLinks items={section.items} />
                </div>
              ))}

              {/* Unassigned empty state */}
              {teacherType === 'unassigned' && (
                <div className="mx-4 px-4 py-5 bg-amber-50 border border-amber-200
                                rounded-xl text-center">
                  <p className="text-sm font-medium text-amber-800 mb-1">
                    No classes assigned yet
                  </p>
                  <p className="text-xs text-amber-700">
                    Contact your admin to be assigned to a class or subject.
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
            <button className="w-full px-3 py-2 bg-emerald-600 text-white text-xs
                               font-medium rounded hover:bg-emerald-700 transition-colors">
              Get Support
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
