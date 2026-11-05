'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, GraduationCap, Users, CalendarDays, AlertCircle } from 'lucide-react';
import { useEnrollmentPromotionData, usePromoteStudents } from '@/src/hooks/queries/useEnrollmentPromotion';
import { EnrollmentPromotionCandidate } from '@/src/types/enrollment';
import { _levelOrder } from '@/src/utils/levelOrder';

const selectClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

export default function AdminEnrollmentsPage() {
  const [sourceYearId, setSourceYearId] = useState('');
  const [sourceClassId, setSourceClassId] = useState('');
  const [targetYearId, setTargetYearId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);

  const { data, isLoading, isError, refetch } = useEnrollmentPromotionData({
    sourceAcademicYearId: sourceYearId || undefined,
    sourceClassId: sourceClassId || undefined,
    targetAcademicYearId: targetYearId || undefined,
    search: search.trim() || undefined,
    page,
    limit: 50,
  });
  const promotion = usePromoteStudents();

  useEffect(() => {
    if (!data) return;
    setSourceYearId((current) => current || data.selectedSourceAcademicYearId || '');
    setTargetYearId((current) => current || data.selectedTargetAcademicYearId || '');
    setSourceClassId((current) => current || data.selectedSourceClassId || '');
  }, [data]);

  const sourceYear = data?.academicYears.find((year) => year.id === sourceYearId);
  const targetYear = data?.academicYears.find((year) => year.id === targetYearId);
  const sourceClass = data?.classes.find((item) => item.id === sourceClassId);
  const targetClasses = useMemo(() => data?.classes.filter((item) =>
    !sourceClass || _levelOrder(item.level) > _levelOrder(sourceClass.level)
  ) ?? [], [data?.classes, sourceClass]);
  const chosenTargetClass = targetClasses.find((item) => item.id === targetClassId);
  const candidates = data?.candidates ?? [];
  const eligible = candidates.filter((candidate) => !candidate.targetEnrollment);
  const allVisibleSelected = eligible.length > 0 && eligible.every((candidate) => selected.has(candidate.studentId));

  useEffect(() => {
    setSelected(new Set());
    setPage(1);
  }, [sourceYearId, sourceClassId, targetYearId, search]);

  useEffect(() => {
    if (targetClassId && !targetClasses.some((item) => item.id === targetClassId)) setTargetClassId('');
  }, [targetClasses, targetClassId]);

  const toggleStudent = (studentId: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(studentId)) next.delete(studentId); else next.add(studentId);
    return next;
  });

  const toggleVisible = () => setSelected((current) => {
    const next = new Set(current);
    if (allVisibleSelected) eligible.forEach((candidate) => next.delete(candidate.studentId));
    else eligible.forEach((candidate) => next.add(candidate.studentId));
    return next;
  });

  const submitPromotion = async () => {
    if (!sourceYearId || !sourceClassId || !targetYearId || !targetClassId || selected.size === 0) return;
    try {
      await promotion.mutateAsync({
        studentIds: Array.from(selected),
        sourceAcademicYearId: sourceYearId,
        sourceClassId,
        targetAcademicYearId: targetYearId,
        targetClassId,
      });
      setSelected(new Set());
      setConfirming(false);
      await refetch();
    } catch {
      // The mutation hook reports the server error through the app toast.
    }
  };

  const ready = Boolean(sourceYear && sourceClass && targetYear);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Academics</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Promote students</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Move a class cohort into a higher class for the next academic session. Previous enrollment records stay available in each student’s history.</p>
        </div>
        <Link href="/dashboard/admin/sessions" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Manage academic sessions →</Link>
      </header>

      <section className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-medium text-gray-700">From academic session
          <select className={`${selectClass} mt-1.5`} value={sourceYearId} onChange={(event) => { setSourceYearId(event.target.value); setTargetYearId(''); }}>
            <option value="">Choose source session</option>
            {data?.academicYears.map((year) => <option key={year.id} value={year.id}>{year.label}{year.isCurrent ? ' (current)' : ''}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">From class
          <select className={`${selectClass} mt-1.5`} value={sourceClassId} onChange={(event) => setSourceClassId(event.target.value)}>
            <option value="">Choose source class</option>
            {data?.classes.map((item) => <option key={item.id} value={item.id}>{item.level} · {data.classEnrollmentCounts[item.id] ?? 0} students</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">To academic session
          <select className={`${selectClass} mt-1.5`} value={targetYearId} onChange={(event) => setTargetYearId(event.target.value)}>
            <option value="">Choose target session</option>
            {data?.academicYears.filter((year) => !sourceYear || new Date(year.startDate) > new Date(sourceYear.startDate)).map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">To class
          <select className={`${selectClass} mt-1.5`} value={targetClassId} onChange={(event) => setTargetClassId(event.target.value)}>
            <option value="">Choose higher class</option>
            {targetClasses.map((item) => <option key={item.id} value={item.id}>{item.level}</option>)}
          </select>
        </label>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-5 text-sm text-gray-600">
            <span className="inline-flex items-center gap-2"><Users size={16} /> {sourceClassId ? data?.classEnrollmentCounts[sourceClassId] ?? 0 : 'Select a class'} {sourceClassId ? 'students in cohort' : ''}</span>
            {targetYear && <span className="inline-flex items-center gap-2"><CalendarDays size={16} /> {targetYear.label}</span>}
            {chosenTargetClass && <span className="inline-flex items-center gap-2"><GraduationCap size={16} /> {chosenTargetClass.level}</span>}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or student number" />
          </div> 
        </div>

        {!ready ? <div className="p-12 text-center text-sm text-gray-500">Choose a source session, source class, and later target session to load students.</div>
        : isLoading ? <div className="p-12 text-center text-sm text-gray-500">Loading the selected cohort…</div>
        : isError ? <div className="flex flex-col items-center gap-3 p-12 text-center text-sm text-red-600"><AlertCircle size={20} />Could not load enrollment data.<button className="font-medium underline" onClick={() => void refetch()}>Try again</button></div>
        : candidates.length === 0 ? <div className="p-12 text-center text-sm text-gray-500">No active students match this cohort and search.</div>
        : <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr>
                <th className="w-12 px-5 py-3"><input aria-label="Select all eligible students on this page" type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} /></th>
                <th className="px-5 py-3">Student</th><th className="px-5 py-3">Student number</th><th className="px-5 py-3">Target session status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.map((candidate: EnrollmentPromotionCandidate) => <tr key={candidate.enrollmentId} className="hover:bg-gray-50/70">
                  <td className="px-5 py-4"><input aria-label={`Select ${candidate.firstName} ${candidate.lastName}`} type="checkbox" disabled={Boolean(candidate.targetEnrollment)} checked={selected.has(candidate.studentId)} onChange={() => toggleStudent(candidate.studentId)} /></td>
                  <td className="px-5 py-4 font-medium text-gray-900">{candidate.firstName} {candidate.lastName}</td>
                  <td className="px-5 py-4 text-gray-600">{candidate.studentNumber}</td>
                  <td className="px-5 py-4">{candidate.targetEnrollment ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">Already enrolled · {candidate.targetEnrollment.classLevel}</span> : <span className="text-gray-500">Ready to promote</span>}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">{selected.size} selected · Students already enrolled in the target session are unavailable.</p>
            <div className="flex items-center gap-3">
              <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Previous</button>
              <span className="text-sm text-gray-500">Page {data?.meta.page ?? page} of {Math.max(1, data?.meta.totalPages ?? 1)}</span>
              <button disabled={page >= (data?.meta.totalPages ?? 1)} onClick={() => setPage((current) => current + 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        </>}
      </section>

      <div className="flex justify-end">
        <button disabled={!selected.size || !targetClassId || promotion.isPending} onClick={() => setConfirming(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
          {promotion.isPending ? 'Promoting…' : `Promote ${selected.size || ''} student${selected.size === 1 ? '' : 's'}`} <ArrowRight size={16} />
        </button>
      </div>

      {confirming && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirming(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="promotion-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <h2 id="promotion-title" className="text-lg font-semibold text-gray-900">Confirm student promotion</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">Promote <strong>{selected.size} selected student{selected.size === 1 ? '' : 's'}</strong> from <strong>{sourceClass?.level}, {sourceYear?.label}</strong> to <strong>{chosenTargetClass?.level}, {targetYear?.label}</strong>? This adds an enrollment for the new session and keeps the previous record.</p>
          <div className="mt-6 flex justify-end gap-3"><button disabled={promotion.isPending} className="rounded-lg border px-4 py-2 text-sm" onClick={() => setConfirming(false)}>Cancel</button><button disabled={promotion.isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => void submitPromotion()}>{promotion.isPending ? 'Promoting…' : 'Confirm promotion'}</button></div>
        </section>
      </div>}
    </main>
  );
}
