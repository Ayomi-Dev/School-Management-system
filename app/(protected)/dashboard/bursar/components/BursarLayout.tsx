"use client";

import { useCurrentTerm } from "@/src/hooks/queries/useAcademic";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SidebarContent } from "./SideBar";
import { Bell, Search, X } from "lucide-react";
import { Breadcrumb, pageTitle } from "./navbars/breadCrumb";
import Link from "next/link";
import { Topbar } from "@/src/components/layouts";

export default function BursarLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
 
  // Resolve current term once — passed down to SidebarStats and the search bar
  const { termId, termPeriod } = useCurrentTerm();
  
 
  return (
    <div className="min-h-screen bg-gray-50 flex">
 
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 bg-linear-to-b from-emerald-700 to-teal-800 fixed inset-y-0 left-0 z-40 shadow-xl">
        <SidebarContent pathname={pathname} termId={termId} />
      </aside>
 
      {/* ── Mobile drawer backdrop ── */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}
 
      {/* ── Mobile drawer ── */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-linear-to-b from-emerald-700 to-teal-800 shadow-2xl transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Close menu"
        >
          <X size={16} className="text-white" />
        </button>
        <SidebarContent
          pathname={pathname}
          termId={termId}
          onNavClick={() => setDrawerOpen(false)}
        />
      </aside>
 
      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-60">
        
        {/* Desktop topbar */}
        <Topbar />
        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
          <div>
            <h1 className="text-base font-bold text-gray-900">
              {pageTitle(pathname)}
            </h1>
            {termPeriod && (
              <p className="text-xs text-gray-400 mt-0.5">{termPeriod}</p>
            )}
          </div>
 
          <div className="flex items-center gap-3">
            {/* Quick student search shortcut */}
            <Link
              href="/bursar/students"
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Search size={13} />
              Find student…
            </Link>
 
            {/* Notification bell */}
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell size={18} className="text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
 
            <div className="h-5 w-px bg-gray-200" />
 
            {/* Bursar avatar */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                B
              </div>
              <span className="text-sm font-medium text-gray-700">My Account</span>
            </div>
          </div>
        </div>
 
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 lg:px-8 py-6">
            <Breadcrumb pathname={pathname} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}