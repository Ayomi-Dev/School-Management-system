import { ChevronRight } from "lucide-react";
import  Link  from "next/link";

const PATH_LABELS: Record<string, string> = {
  bursar:          'Bursar',
  dashboard:       'Dashboard',
  'fee-structures':'Fee Structures',
  classes:         'Classes',
  students:        'Students',
  payments:        'Payments',
  notifications:   'Notifications',
};

export function pageTitle(pathname: string): string {
  if (pathname === '/bursar/dashboard')            return 'Dashboard';
  if (pathname.startsWith('/bursar/fee-structures')) return 'Fee Structures';
  if (pathname.startsWith('/bursar/classes'))       return 'Class Overview';
  if (pathname.startsWith('/bursar/students'))      return 'Students';
  if (pathname.startsWith('/bursar/payments'))      return 'Payment Records';
  return 'Bursar Portal';
}
 
export function Breadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 2) return null;
 
  const crumbs = segments.map((seg, i) => ({
    label: PATH_LABELS[seg] ?? (seg.length === 24
      ? '…'                           // looks like a MongoDB ObjectId — skip labelling
      : seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ')),
    href: '/' + segments.slice(0, i + 1).join('/'),
  }));
 
  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4 flex-wrap">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={11} className="text-gray-300" />}
          {i === crumbs.length - 1 ? (
            <span className="text-gray-600 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-gray-600 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}