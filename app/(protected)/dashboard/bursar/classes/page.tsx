'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Card } from '@/src/components/ui/Card';
import { Loader } from '@/src/components/ui/Loader';
import {
  AlertCircle,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAcademicYearsList, useCurrentTerm } from '@/src/hooks/queries/useAcademic';
import { useClassesList } from '@/src/hooks/queries/useClasses';
import { useClassFeeOverview } from '@/src/hooks/queries/useFees';
import { naira } from '../components/methodbadge';

// ─── Helpers ──────────────────────────────────────────────────────────────────



const selectCls =
  'appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClassesPage() {
  const router = useRouter();

  // ── All hooks unconditionally at the top ──────────────────────────────────
  const {
    isLoading:  termsLoading,
    terms,
    currentTerm,
    termId:     defaultTermId,
    academicYearId: defaultAcademicYearId,
  } = useCurrentTerm();

  const { data: classes = [], isLoading: classesLoading }  = useClassesList();
  const { data: academicYears = [], isLoading: ayLoading       }  = useAcademicYearsList();
  if(!classes)return

  // Explicit selectors — default to current term and first class
  const [selectedTermId,    setSelectedTermId]    = useState('');
  const [selectedClassId,   setSelectedClassId]   = useState('');
  const [selectedAyId,      setSelectedAyId]      = useState('');

  // Derive active values
  const activeTermId = selectedTermId || defaultTermId;
  const activeTerm   = terms.find((t) => t.id === activeTermId) ?? currentTerm;
  const activeAyId   = selectedAyId  || defaultAcademicYearId;
  const activeClassId = selectedClassId || classes[0]?.id || '';

  const activeClass = classes?.find((c) => c.id === activeClassId);

  const {
    data: overview,
    isLoading: overviewLoading,
    isError:   overviewError,
  } = useClassFeeOverview(
    activeClassId,
    activeTermId,
    activeAyId,
    !!(activeClassId && activeTermId && activeAyId),
  );

  // ── Derived stats ─────────────────────────────────────────────────────────
  const rows       = overview?.rows ?? [];
  const cleared    = rows.filter((r) => r.isCleared);
  const pending    = rows.filter((r) => !r.isCleared);
  const totalDue   = rows.reduce((s, r) => s + r.totalDue,   0);
  const totalPaid  = rows.reduce((s, r) => s + r.totalPaid,  0);
  const outstanding = rows.reduce((s, r) => s + r.outstanding, 0);
  const rate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  // ── Loading / error guards — after all hooks ──────────────────────────────
  if (termsLoading || classesLoading || ayLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <Loader />
      </div>
    );
  }

  if (terms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-3">
        <AlertCircle size={30} className="text-amber-400" />
        <p className="text-sm text-gray-500">No terms found. Create a term first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + selectors */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Fee collection status by class
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class */}
          <div className="relative">
            <select
              value={activeClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className={selectCls}
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.level}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Term */}
          <div className="relative">
            <select
              value={activeTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className={selectCls}
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.period} — {t.academicYear?.label}
                  {t.isCurrent ? ' (Current)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Academic year */}
          <div className="relative">
            <select
              value={activeAyId}
              onChange={(e) => setSelectedAyId(e.target.value)}
              className={selectCls}
            >
              {academicYears?.map((ay) => (
                <option key={ay.id} value={ay.id}>{ay.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* KPI strip */}
      {!overviewLoading && rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Students',
              value: String(rows.length),
              sub:   `${activeClass?.level ?? ''}`,
              icon:  <Users size={16} className="text-blue-600" />,
              bg:    'bg-blue-50', text: 'text-blue-700',
            },
            {
              label: 'Collected',
              value: naira(totalPaid),
              sub:   `${rate}% of total`,
              icon:  <TrendingUp size={16} className="text-emerald-600" />,
              bg:    'bg-emerald-50', text: 'text-emerald-700',
            },
            {
              label: 'Outstanding',
              value: naira(outstanding),
              sub:   `${pending.length} student(s)`,
              icon:  <Clock size={16} className="text-amber-600" />,
              bg:    'bg-amber-50', text: 'text-amber-700',
            },
            {
              label: 'Cleared',
              value: String(cleared.length),
              sub:   `of ${rows.length} students`,
              icon:  <CheckCircle2 size={16} className="text-teal-600" />,
              bg:    'bg-teal-50', text: 'text-teal-700',
            },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center shrink-0`}>
                {k.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">{k.label}</p>
                <p className={`text-lg font-black truncate ${k.text}`}>{k.value}</p>
                <p className="text-[10px] text-gray-400">{k.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {!overviewLoading && rows.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">
              Collection Progress
            </p>
            <span className="text-sm font-bold text-emerald-700">{rate}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-blue-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(rate, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Collected: <b className="text-gray-700">{naira(totalPaid)}</b></span>
            <span>Outstanding: <b className="text-red-600">{naira(outstanding)}</b></span>
            <span>Total Due: <b className="text-gray-700">{naira(totalDue)}</b></span>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {overviewLoading ? (
          <div className="flex items-center justify-center h-60">
            <Loader />
          </div>
        ) : !activeClassId ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3 text-gray-400">
            <Users size={28} />
            <p className="text-sm">Select a class to view fee status.</p>
          </div>
        ) : overviewError ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm text-gray-500">Could not load fee overview.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3 text-gray-400 p-6">
            <Users size={28} />
            <p className="text-sm font-medium">No fee data for this class</p>
            <p className="text-xs text-center">
              Assign fee structures to students in this class first.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Student
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    Total Due
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    Total Paid
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    Outstanding
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => (
                  <tr
                    key={row.studentId}
                    className="hover:bg-gray-50/60 cursor-pointer group"
                    onClick={() => router.push(`/bursar/students/${row.studentId}`)}
                  >
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                        {row.name}
                      </p>
                      <p className="text-xs text-gray-400">{row.studentNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {naira(row.totalDue)}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-emerald-700">
                      {naira(row.totalPaid)}
                    </td>
                    <td className={`px-4 py-3 text-center font-bold ${row.isCleared ? 'text-emerald-600' : 'text-red-600'}`}>
                      {naira(row.outstanding)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.isCleared ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={10} />Cleared
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                          <Clock size={10} />Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight
                        size={15}
                        className="text-gray-300 group-hover:text-emerald-500 transition-colors"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-5 py-3 font-semibold text-gray-700">Total</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">{naira(totalDue)}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-700">{naira(totalPaid)}</td>
                  <td className={`px-4 py-3 text-center font-black ${outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {naira(outstanding)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}