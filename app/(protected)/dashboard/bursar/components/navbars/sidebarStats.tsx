import { useBursarDashboard } from "@/src/hooks/queries/useBursar";
import { naira } from "../methodbadge";
import { GraduationCap, LayoutDashboard, Receipt, Tag, Users } from "lucide-react";

export const NAV_GROUPS = [
  {
    label: null, // no section header for the top group
    items: [
      { href: '/dashboard/bursar', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Fee Management',
    items: [
      { href: '/dashboard/bursar/feeStructure',  label: 'Fee Structures',  icon: Tag             },
      { href: '/dashboard/bursar/classes',         label: 'Class Overview',  icon: GraduationCap   },
    ],
  },
  {
    label: 'Payments',
    items: [
      { href: '/dashboard/bursar/students',        label: 'Students',        icon: Users           },
      { href: '/dashboard/bursar/payments',        label: 'Payment Records', icon: Receipt         },
    ],
  },
] as const;

export function SidebarStats({ termId }: { termId: string }) {
  const { data } = useBursarDashboard(termId);
 
  if (!data) return null;
 
  const rate = data.totalDue > 0
    ? Math.round((data.totalCollected / data.totalDue) * 100)
    : 0;
 
  return (
    <div className="mx-3 mb-4 rounded-xl bg-white/10 px-3 py-3 space-y-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
        Current Term
      </p>
 
      {/* Collection rate bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-emerald-100">Collection rate</span>
          <span className="text-[11px] font-bold text-white">{rate}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-700"
            style={{ width: `${Math.min(rate, 100)}%` }}
          />
        </div>
      </div>
 
      {/* Two number chips */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/10 rounded-lg px-2.5 py-2 text-center">
          <p className="text-sm font-black text-white leading-none">
            {naira(data.totalCollected)}
          </p>
          <p className="text-[9px] text-emerald-300 mt-0.5 uppercase tracking-wide">
            Collected
          </p>
        </div>
        <div className="bg-white/10 rounded-lg px-2.5 py-2 text-center">
          <p className="text-sm font-black text-red-300 leading-none">
            {naira(data.totalOutstanding)}
          </p>
          <p className="text-[9px] text-emerald-300 mt-0.5 uppercase tracking-wide">
            Pending
          </p>
        </div>
      </div>
    </div>
  );
}