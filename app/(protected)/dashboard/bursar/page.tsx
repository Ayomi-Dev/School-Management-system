'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBursarDashboard } from '@/src/hooks/queries/useBursar';
import { Loader } from '@/src/components/ui/Loader';
import {
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { useTerms } from '@/src/hooks/queries/useAcademic';
import { DashboardContent } from './components/dashboardcontent';



export default function BursarDashboardPage() {
  const router = useRouter();

  // ── 1. Load available terms ────────────────────────────────────────────────
  const { data: terms = [], isLoading: termsLoading } = useTerms();
    if(!terms){
        console.log("No terms found");
        return 
    }
  // Default to the current term once terms are loaded.
  // Stored as local state so the bursar can switch terms via the selector.
  const currentTerm = terms.find((t) => t?.isCurrent) ?? terms[0]
  const [selectedTermId, setSelectedTermId] = useState<string>('');

  // Resolve the active termId: prefer explicit selection, fall back to current
  const activeTermId = selectedTermId || currentTerm?.id || '';
  const activeTerm   = terms?.find((t) => t.id === activeTermId) ?? currentTerm;
  const termLabel    = activeTerm
    ? `${activeTerm.period} — ${activeTerm.academicYear?.label}`
    : '';

  // ── 2. Load dashboard data once we have a termId ──────────────────────────
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    isError,
  } = useBursarDashboard(activeTermId);

  // ── Loading states ────────────────────────────────────────────────────────
  if (termsLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader />
      </div>
    );
  }

  if (terms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <AlertCircle size={32} className="text-amber-400" />
        <p className="text-sm text-gray-500">No terms found. Create a term first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header with term selector */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            School-wide fee collection summary
          </p>
        </div>

        {/* Term selector */}
        <div className="relative">
          <select
            value={activeTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2 text-sm font-medium border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.period} — {t.academicYear?.label}
                {t.isCurrent ? ' (Current)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Dashboard content — shows loader/error inline so the term selector stays visible */}
      {dashboardLoading ? (
        <div className="flex items-center justify-center h-72">
          <Loader />
        </div>
      ) : isError || !dashboardData ? (
        <div className="flex flex-col items-center justify-center h-72 gap-3">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-sm text-gray-500">Could not load dashboard data.</p>
        </div>
      ) : (
        <DashboardContent
          data={dashboardData}
          termLabel={termLabel}
          onClassClick={(classId) => router.push(`/bursar/classes/${classId}`)}
        />
      )}
    </div>
  );
}

