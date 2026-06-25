'use client';

import { Card } from '@/src/components/ui/Card';
import { Loader } from '@/src/components/ui/Loader';
import { AttendanceSummary } from '@/src/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AttendanceCardProps {
  attendance:  AttendanceSummary | undefined;
  isLoading:   boolean;
  isError:     boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface BannerConfig {
  label:      string;
  badgeClass: string;
  barClass:   string;
}

function getBannerConfig(pct: number): BannerConfig {
  if (pct >= 90) return { label: 'Excellent',    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200', barClass: 'bg-emerald-500' };
  if (pct >= 75) return { label: 'Satisfactory', badgeClass: 'text-amber-700   bg-amber-50   border-amber-200',   barClass: 'bg-amber-400'   };
  return              { label: 'At Risk',       badgeClass: 'text-rose-700    bg-rose-50    border-rose-200',    barClass: 'bg-rose-500'    };
}

interface StatPillProps {
  label:     string;
  value:     number;
  colorClass: string;
  icon:      string;
}

function StatPill({ label, value, colorClass, icon }: StatPillProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border p-3 gap-0.5 ${colorClass}`}>
      <span className="text-lg">{icon}</span>
      <span className="text-xl font-extrabold leading-none">{value}</span>
      <span className="text-xs font-medium opacity-80">{label}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AttendanceCard({ attendance, isLoading, isError }: AttendanceCardProps) {

  // ── States ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card className="p-6 flex items-center justify-center min-h-80">
        <Loader />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6 flex items-center justify-center min-h-80">
        <p className="text-sm text-rose-500">Failed to load attendance. Please try again.</p>
      </Card>
    );
  }

  if (!attendance || attendance.total === 0) {
    return (
      <Card className="p-6 flex flex-col gap-3 min-h-80">
        <Header />
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          No attendance records found for this term.
        </div>
      </Card>
    );
  }

  const pct          = attendance.rate;
  const bannerConfig = getBannerConfig(pct);

  return (
    <Card className="p-6 flex flex-col gap-5 h-full">
      <Header />

      {/* ── Overall banner ───────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-0.5">
              Attendance Rate
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-gray-800 leading-none">
                {pct}
                <span className="text-xl font-semibold text-gray-400">%</span>
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${bannerConfig.badgeClass}`}>
                {bannerConfig.label}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 self-end">
            {attendance.total} sessions total
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`${bannerConfig.barClass} h-2.5 rounded-full transition-all duration-700`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── Stat pills ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <StatPill
          icon="✅"
          label="Present"
          value={attendance.present}
          colorClass="text-emerald-700 bg-emerald-50 border-emerald-200"
        />
        <StatPill
          icon="❌"
          label="Absent"
          value={attendance.absent}
          colorClass="text-rose-700 bg-rose-50 border-rose-200"
        />
        <StatPill
          icon="⏰"
          label="Late"
          value={attendance.late}
          colorClass="text-amber-700 bg-amber-50 border-amber-200"
        />
        <StatPill
          icon="📝"
          label="Unmarked"
          value={attendance.unmarked}
          colorClass="text-gray-600 bg-gray-50 border-gray-200"
        />
      </div>
    </Card>
  );
}

function Header() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 tracking-tight">📋 Attendance Record</h2>
      <p className="text-sm text-gray-500 mt-0.5">Your attendance summary for this term</p>
    </div>
  );
}
