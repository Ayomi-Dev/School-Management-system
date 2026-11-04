'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, ArrowLeft, Download, RefreshCw, Users } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { DataTable } from '@/src/components/ui/DataTable';
import { useAcademicReport } from '@/src/hooks/queries/useAcademicReport';
import { AcademicReportClassRow, AcademicReportStudentRow } from '@/src/types/academicReport';

const selectClassName = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const formatPercent = (value: number | null | undefined) => value == null ? '—' : `${value.toFixed(value % 1 ? 1 : 0)}%`;
const formatScore = (value: number | null | undefined) => value == null ? '—' : `${value.toFixed(value % 1 ? 1 : 0)}%`;
const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

export default function AcademicReportsPage() {
  const [academicYearId, setAcademicYearId] = useState('');
  const [termId, setTermId] = useState('');
  const [classId, setClassId] = useState('');
  const filters = useMemo(() => ({
    ...(academicYearId ? { academicYearId } : {}),
    ...(termId ? { termId } : {}),
    ...(classId ? { classId } : {}),
  }), [academicYearId, termId, classId]);
  const reportQuery = useAcademicReport(filters);
  const report = reportQuery.data;

  const selectedYearId = academicYearId || report?.selectedAcademicYearId || '';
  const selectedYear = report?.academicYears.find((year) => year.id === selectedYearId);
  const selectedTermValue = termId || report?.selectedTermId || '';
  const selectedClass = report?.classes.find((classItem) => classItem.id === classId);

  const exportReport = () => {
    if (!report) return;
    const rows: (string | number)[][] = [
      ['Academic performance report', ''],
      ['Academic year', selectedYear?.label ?? '—'],
      ['Term', report.selectedTermLabel],
      ['Class filter', selectedClass?.level ?? 'All classes'],
      [],
      ['Class', 'Enrolled students', 'Assessed students', 'Average score', 'Pass rate'],
      ...report.classPerformance.map((row) => [
        row.className,
        row.totalStudents,
        row.assessedStudents,
        row.averageScore ?? '—',
        row.passRate == null ? '—' : `${row.passRate}%`,
      ]),
      [],
      ['Student', 'Student number', 'Class', 'Average score', 'Subjects assessed'],
      ...report.studentPerformance.map((row) => [
        row.studentName,
        row.studentNumber,
        row.className,
        row.averageScore,
        row.subjectsAttempted,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => escapeCsv(cell)).join(',')).join('\r\n');
    const blobUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `academic-report-${(selectedYear?.label ?? 'school-year').replace(/[^a-z0-9-]/gi, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  };

  const classColumns = [
    { key: 'className' as const, label: 'Class', render: (value: unknown) => <span className="font-semibold text-gray-900">{String(value)}</span> },
    { key: 'totalStudents' as const, label: 'Enrolled' },
    { key: 'assessedStudents' as const, label: 'Assessed' },
    {
      key: 'averageScore' as const,
      label: 'Average score',
      render: (value: unknown) => <span className="font-medium text-gray-900">{formatScore(value as number | null)}</span>,
    },
    {
      key: 'passRate' as const,
      label: 'Pass rate',
      render: (value: unknown) => value == null
        ? <span className="text-gray-400">No published scores</span>
        : <span className={(value as number) >= 50 ? 'font-semibold text-green-700' : 'font-semibold text-amber-700'}>{formatPercent(value as number)}</span>,
    },
  ];

  const studentColumns = [
    { key: 'studentName' as const, label: 'Student', render: (value: unknown) => <span className="font-medium text-gray-900">{String(value)}</span> },
    { key: 'studentNumber' as const, label: 'Student number' },
    { key: 'className' as const, label: 'Class' },
    { key: 'subjectsAttempted' as const, label: 'Subjects assessed' },
    { key: 'averageScore' as const, label: 'Average score', render: (value: unknown) => <span className="font-semibold text-gray-900">{formatScore(value as number)}</span> },
  ];

  const openClass = (row: AcademicReportClassRow) => setClassId(row.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-blue-700">Reports / Academic</p>
          <h1 className="text-3xl font-bold text-gray-900">Academic Reports</h1>
          <p className="mt-1 text-gray-600">Published student results by class and term.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => reportQuery.refetch()}>
            <RefreshCw size={16} className={reportQuery.isFetching ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button className="flex items-center gap-2" onClick={exportReport} disabled={!report || reportQuery.isLoading}>
            <Download size={17} />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-gray-900">Report filters</h2>
            <p className="mt-0.5 text-sm text-gray-500">Results update when you change a filter.</p>
          </div>
          {report && <span className="text-xs text-gray-500">Auto refresh every 30 seconds</span>}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="block text-sm font-medium text-gray-700">
            Academic year
            <select
              value={selectedYearId}
              onChange={(event) => { setAcademicYearId(event.target.value); setTermId(''); setClassId(''); }}
              className={`${selectClassName} mt-2`}
              disabled={!report?.academicYears.length}
            >
              {report?.academicYears.map((year) => <option key={year.id} value={year.id}>{year.label}{year.isCurrent ? ' · Current' : ''}</option>)}
              {!report?.academicYears.length && <option value="">No academic years</option>}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Term
            <select
              value={selectedTermValue}
              onChange={(event) => setTermId(event.target.value)}
              className={`${selectClassName} mt-2`}
              disabled={!selectedYear?.terms.length}
            >
              <option value="all">All terms</option>
              {selectedYear?.terms.map((term) => <option key={term.id} value={term.id}>{term.period}{term.isCurrent ? ' · Current' : ''}</option>)}
              {!selectedYear?.terms.length && <option value="">No terms available</option>}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Class
            <select value={classId} onChange={(event) => setClassId(event.target.value)} className={`${selectClassName} mt-2`}>
              <option value="">All classes</option>
              {report?.classes.map((item) => <option key={item.id} value={item.id}>{item.level}</option>)}
            </select>
          </label>
        </div>
      </Card>

      {reportQuery.isError ? (
        <Card>
          <div className="py-8 text-center">
            <p className="font-semibold text-red-700">Could not load academic results.</p>
            <p className="mt-1 text-sm text-gray-600">Check your connection and try again.</p>
            <Button variant="outline" className="mt-4" onClick={() => reportQuery.refetch()}>Try again</Button>
          </div>
        </Card>
      ) : reportQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <Card key={item}><div className="h-20 animate-pulse rounded bg-gray-100" /></Card>)}
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <SummaryCard label="Enrolled students" value={report.summary.totalStudents.toLocaleString()} detail="In the selected year and scope" icon={<Users size={18} />} />
            <SummaryCard label="Assessed students" value={report.summary.assessedStudents.toLocaleString()} detail="Have published scores" icon={<Activity size={18} />} />
            <SummaryCard label="Average score" value={formatScore(report.summary.averageScore)} detail="Mean student average" />
            <SummaryCard label="Pass rate" value={formatPercent(report.summary.passRate)} detail={`Passing average: ${report.passThreshold}% or higher`} accent="green" />
          </div>

          {reportQuery.isFetching && <p className="text-right text-xs text-gray-500">Updating report…</p>}

          <Card>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Class performance</h2>
                <p className="mt-1 text-sm text-gray-500">{selectedYear?.label ?? 'Academic year'} · {report.selectedTermLabel}. Pass rate uses assessed students.</p>
              </div>
              {classId && <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => setClassId('')}><ArrowLeft size={15} /> All classes</Button>}
            </div>
            <DataTable<AcademicReportClassRow>
              data={report.classPerformance}
              columns={classColumns}
              emptyMessage="No enrolled classes are available for these filters."
              rowActions={(row) => <Button variant="outline" size="sm" onClick={() => openClass(row)}>View students</Button>}
            />
          </Card>

          {classId ? (
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">{selectedClass?.level ?? 'Class'} student results</h2>
                <p className="mt-1 text-sm text-gray-500">Students with published scores, ranked by average.</p>
              </div>
              <DataTable<AcademicReportStudentRow>
                data={report.studentPerformance}
                columns={studentColumns}
                emptyMessage="No published scores are available for this class and period."
              />
            </Card>
          ) : (
            <Card>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Top performers</h2>
                  <p className="mt-1 text-sm text-gray-500">Highest student averages in the selected scope.</p>
                </div>
              </div>
              {report.studentPerformance.length ? (
                <div className="divide-y divide-gray-100">
                  {report.studentPerformance.slice(0, 5).map((student, index) => (
                    <div key={student.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">{index + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{student.studentName}</p>
                          <p className="text-xs text-gray-500">{student.studentNumber} · {student.className}</p>
                        </div>
                      </div>
                      <span className="shrink-0 font-bold text-gray-900">{formatScore(student.averageScore)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="py-8 text-center text-sm text-gray-500">No published student scores for this period yet.</p>}
            </Card>
          )}

          <p className="text-xs text-gray-500">Reports include published scores only. Unpublished marks are excluded until they are published.</p>
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
  accent = 'blue',
}: {
  label: string;
  value: string;
  detail: string;
  icon?: ReactNode;
  accent?: 'blue' | 'green';
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {icon && <span className={accent === 'green' ? 'text-green-600' : 'text-blue-600'}>{icon}</span>}
      </div>
      <p className={`mt-3 text-3xl font-bold ${accent === 'green' ? 'text-green-700' : 'text-gray-900'}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{detail}</p>
    </Card>
  );
}
