import { ChevronRight } from "lucide-react";
import Link from "next/link"

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
export function Breadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.split('/').filter(Boolean);
  console.log('Breadcrumb segments:', segments);
  // Only show if deeper than /parent/dashboard
  if (segments.length <= 2) return null;

  const crumbs = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    href:  '/' + segments.slice(0, i + 1).join('/'),
  }));

  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4 flex-wrap">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={12} className="text-gray-300" />}
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