import { Bell, Landmark, LogOut } from "lucide-react";
import { NAV_GROUPS, SidebarStats } from "./navbars/sidebarStats";
import Link from "next/link";

export function SidebarContent({
  pathname,
  termId,
  onNavClick,
}: {
  pathname:   string;
  termId:     string;
  onNavClick?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
 
      {/* Brand strip */}
      <div className="px-6 py-5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Landmark size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">EduTrack</p>
            <p className="text-emerald-300 text-[11px]">Bursar Portal</p>
          </div>
        </div>
      </div>
 
      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {/* Section header */}
            {group.label && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavClick}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-emerald-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon
                      size={17}
                      className={active ? 'text-emerald-600' : ''}
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
 
      {/* Stats strip — shown only when termId is resolved */}
      {termId && <SidebarStats termId={termId} />}
 
      {/* Bottom actions */}
      <div className="px-3 pb-5 border-t border-white/10 pt-3 space-y-0.5 shrink-0">
        <Link
          href="/bursar/notifications"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-emerald-100 hover:bg-white/10 hover:text-white transition-all"
        >
          <Bell size={17} />
          Notifications
        </Link>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-emerald-100 hover:bg-red-500/20 hover:text-red-200 transition-all"
          onClick={() => { /* call your signOut handler */ }}
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </div>
  );
}