'use client';

import { useMemo, useState } from 'react';
import {  Download, FileText, Pencil, Plus, Receipt, Search, Wallet } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Loader } from '@/src/components/ui/Loader';
import { useCurrentTerm, useAcademicYearsList } from '@/src/hooks/queries/useAcademic';
import { useClassesList } from '@/src/hooks/queries/useClasses';
import { useStudentList } from '@/src/hooks/queries/useStudent';
import { useBursarDashboard } from '@/src/hooks/queries/useBursar';
import { useClassFeeOverview, useFeePayments, useFeeStructures, useStudentStatement, usePaymentHistory, useUpdateFeePaymentMutation } from '@/src/hooks/queries/useFees';
import { FeePayment, FeeStructure } from '@/src/types/fees';
import { DashboardContent } from '@/app/(protected)/dashboard/bursar/components/dashboardcontent';
import { FeeCard } from '@/app/(protected)/dashboard/bursar/components/feeCard';
import RecordPaymentModal from '@/app/(protected)/dashboard/bursar/components/modals/RecordPayment';
import { CreateFeeStructureModal } from '@/app/(protected)/dashboard/bursar/components/modals/CreateFeeStructure';
import { AssignFeeModal } from '@/app/(protected)/dashboard/bursar/components/modals/AssignFeeStructure';
import { naira } from '@/app/(protected)/dashboard/bursar/components/methodbadge';
import { ClassFinancialOverview, FinancialTab, formatDate, LoadError, PaymentEditor, selectClass, StudentFinancialRecord, tabs } from '../utils';



export default function AdminFinancialReportsPage() {
  const { terms, termId: defaultTermId, termPeriod, isLoading: termsLoading } = useCurrentTerm();
  const [tab, setTab] = useState<FinancialTab>('overview');
  const [selectedTermId, setSelectedTermId] = useState('');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentPage, setPaymentPage] = useState(1);
  const [createFeeOpen, setCreateFeeOpen] = useState(false);
  const [feeToAssign, setFeeToAssign] = useState<FeeStructure | null>(null);
  const [paymentToEdit, setPaymentToEdit] = useState<FeePayment | null>(null);

  const activeTermId = selectedTermId || defaultTermId;
  const activeTerm = terms.find((term) => term.id === activeTermId) ?? null;
  const academicYearId = activeTerm?.academicYear?.id ?? activeTerm?.academicYearId ?? '';
  const activeTermLabel = activeTerm ? `${activeTerm.period} — ${activeTerm.academicYear?.label ?? ''}` : termPeriod;
  const classesQuery = useClassesList();
  const classes = classesQuery.data ?? [];
  const academicYearsQuery = useAcademicYearsList();
  const academicYears = academicYearsQuery.data ?? [];
  const dashboardQuery = useBursarDashboard(activeTermId);
  const feeStructuresQuery = useFeeStructures(activeTermId);
  const feeStructures = feeStructuresQuery.data ?? [];
  const studentsQuery = useStudentList({
    page: studentPage,
    limit: 50,
    search: studentSearch.trim() || undefined,
    academicYearId: academicYearId || undefined,
  });
  const students = studentsQuery.data?.data ?? [];
  const studentTotalPages = Math.max(1, Math.ceil(
    (studentsQuery.data?.meta.total ?? students.length) / (studentsQuery.data?.meta.limit ?? 50),
  ));
  const selectedStudent = students.find((student) => student.id === studentId);
  const activeClassId = classId || classes[0]?.id || '';
  const classOverviewQuery = useClassFeeOverview(activeClassId, activeTermId, academicYearId, tab === 'classes');
  const paymentFilters = useMemo(() => ({
    termId: activeTermId || undefined,
    search: paymentSearch.trim() || undefined,
    page: paymentPage,
    limit: 50,
  }), [activeTermId, paymentSearch, paymentPage]);
  const paymentsQuery = useFeePayments(paymentFilters, tab === 'payments');

  const exportPayments = () => {
    const rows = paymentsQuery.data?.data ?? [];
    if (!rows.length) return;
    const csvRows = [
      ['Receipt', 'Date', 'Student', 'Student number', 'Term', 'Method', 'Amount', 'Fee structure'],
      ...rows.map((payment) => [
        payment.receiptNumber,
        formatDate(payment.paymentDate),
        `${payment.student.firstName} ${payment.student.lastName}`,
        payment.student.studentNumber,
        `${payment.term.period} ${payment.term.academicYear?.label ?? ''}`,
        payment.paymentMethod,
        payment.amount,
        payment.feeStructureId ?? 'General payment',
      ]),
    ];
    const csv = csvRows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-payments-${(activeTerm?.academicYear?.label ?? 'report').replace(/[^a-z0-9-]/gi, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isInitialLoading = termsLoading || classesQuery.isLoading || academicYearsQuery.isLoading;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-700">Reports / Finance</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="mt-1 text-sm text-gray-600">Review collections, student balances, class accounts, and fee plans.</p>
        </div>
        <label className="block w-full text-sm font-medium text-gray-700 sm:w-64">
          Reporting term
          <select value={activeTermId} onChange={(event) => setSelectedTermId(event.target.value)} className={`${selectClass} mt-1.5`} disabled={!terms.length}>
            {terms.map((term) => <option key={term.id} value={term.id}>{term.period} — {term.academicYear?.label}{term.isCurrent ? ' · Current' : ''}</option>)}
          </select>
        </label>
      </header>

      <nav aria-label="Financial report sections" className="flex gap-2 overflow-x-auto rounded-xl border border-gray-200 bg-white p-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === id ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </nav>

      {isInitialLoading ? <div className="flex h-64 items-center justify-center"><Loader /></div> : !activeTermId ? (
        <Card><div className="py-12 text-center"><FileText className="mx-auto mb-3 text-amber-500" /><h2 className="font-semibold text-gray-900">No reporting term available</h2><p className="mt-1 text-sm text-gray-500">Create an academic session and term before using financial reports.</p></div></Card>
      ) : (
        <>
          {tab === 'overview' && (
            dashboardQuery.isLoading ? <div className="flex h-64 items-center justify-center"><Loader /></div>
              : dashboardQuery.data ? <DashboardContent data={dashboardQuery.data} termLabel={activeTermLabel} onClassClick={(id) => { setClassId(id); setTab('classes'); }} />
                : <LoadError message="Could not load the school collection summary." onRetry={() => void dashboardQuery.refetch()} />
          )}

          {tab === 'students' && (
            <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <Card className="overflow-hidden p-0">
                <div className="border-b border-gray-100 p-4">
                  <h2 className="font-semibold text-gray-900">Student financial records</h2>
                  <p className="mt-1 text-xs text-gray-500">Showing students enrolled in {activeTerm?.academicYear?.label ?? 'the selected session'}.</p>
                  <div className="relative mt-3">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={studentSearch} onChange={(event) => { setStudentSearch(event.target.value); setStudentPage(1); }} placeholder="Search name or student number" className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  </div>
                </div>
                {studentsQuery.isLoading ? <div className="flex h-64 items-center justify-center"><Loader /></div> : students.length ? (
                  <div className="max-h-155 overflow-auto">
                    {students.map((student) => {
                      const enrollment = (student as typeof student & { enrollments?: Array<{ class?: { level: string } }> }).enrollments?.[0];
                      return <button key={student.id} type="button" onClick={() => setStudentId(student.id)} className={`flex w-full items-center justify-between gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50 ${studentId === student.id ? 'bg-emerald-50' : ''}`}>
                        <span className="min-w-0"><span className="block truncate text-sm font-semibold text-gray-900">{student.firstName} {student.lastName}</span><span className="mt-0.5 block text-xs text-gray-500">{student.studentNumber} · {enrollment?.class?.level ?? student.level}</span></span>
                        <span className="shrink-0 text-xs font-medium text-emerald-700">View account</span>
                      </button>;
                    })}
                    <div className="flex items-center justify-between p-3 text-xs text-gray-500">
                      <span>{studentsQuery.data?.meta.total ?? students.length} students</span>
                      <span className="flex gap-2"><button disabled={studentPage <= 1} onClick={() => setStudentPage((page) => page - 1)} className="rounded border px-2 py-1 disabled:opacity-40">Previous</button><button disabled={studentPage >= studentTotalPages} onClick={() => setStudentPage((page) => page + 1)} className="rounded border px-2 py-1 disabled:opacity-40">Next</button></span>
                    </div>
                  </div>
                ) : <p className="p-8 text-center text-sm text-gray-500">No students found for this session.</p>}
              </Card>

              {studentId ? (
                <SelectedStudentFinancialRecord
                  key={`${studentId}:${activeTermId}`}
                  studentId={studentId}
                  student={selectedStudent}
                  termId={activeTermId}
                  termLabel={activeTermLabel}
                  currentTermId={activeTermId}
                  onEditPayment={setPaymentToEdit}
                />
              ) : (
                <StudentFinancialRecord
                  student={undefined}
                  statement={undefined}
                  history={[]}
                  isLoading={false}
                  historyLoading={false}
                  statementError={false}
                  historyError={false}
                  onRetryStatement={() => undefined}
                  onRetryHistory={() => undefined}
                  currentTermId={activeTermId}
                  onRecordPayment={() => undefined}
                  onEditPayment={setPaymentToEdit}
                />
              )}
            </section>
          )}

          {tab === 'classes' && (
            <section className="space-y-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div><h2 className="text-lg font-semibold text-gray-900">Class financial records</h2><p className="mt-1 text-sm text-gray-500">Fee balances for the selected term and its academic year.</p></div>
                <select value={activeClassId} onChange={(event) => setClassId(event.target.value)} className={`${selectClass} sm:w-64`}>
                  {classes.map((item) => <option key={item.id} value={item.id}>{item.level}</option>)}
                </select>
              </div>
              {classOverviewQuery.isLoading ? 
                <div className="flex h-56 items-center justify-center">
                  <Loader />
                </div> : classOverviewQuery.data ? 
                <ClassFinancialOverview 
                  classLevel={classOverviewQuery.data.classLevel} 
                  rows={classOverviewQuery.data.rows} 
                  onSelectStudent={(id) => { setStudentId(id); setTab('students'); }}
                /> : 
                <LoadError message="Could not load this class's fee records." 
                  onRetry={() => void classOverviewQuery.refetch()} 
                />
              }
            </section>
          )}

          {tab === 'payments' && (
            <Card className="overflow-hidden p-0">
              <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Payment register
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Recorded payments for {activeTermLabel}.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={paymentSearch} onChange={(event) => { setPaymentSearch(event.target.value); setPaymentPage(1); }} placeholder="Search student" className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm sm:w-56" /></div>
                  <Button variant="outline" 
                    className="shrink-0" 
                    onClick={exportPayments} 
                    disabled={!paymentsQuery.data?.data.length}
                  >
                    <Download size={16} className="mr-2" />
                    Export
                  </Button>
                </div>
              </div>
              {paymentsQuery.isLoading ? 
                <div className="flex h-56 items-center justify-center">
                  <Loader />
                </div> : paymentsQuery.isError ? 
                <LoadError message="Could not load payment records." onRetry={() => void paymentsQuery.refetch()} />
                : 
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-4 py-3">
                            Receipt
                          </th>
                          <th className="px-4 py-3">
                            Student
                          </th>
                          <th className="px-4 py-3">
                            Date
                          </th>
                          <th className="px-4 py-3">
                            Method
                          </th>
                          <th className="px-4 py-3 text-right">
                            Amount
                          </th>
                          <th className="px-4 py-3" />
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100">
                          {(paymentsQuery.data?.data ?? []).map((payment) => 
                            <tr key={payment.id} className="hover:bg-gray-50">
                              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                                {payment.receiptNumber}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">
                                  {payment.student.firstName} {payment.student.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {payment.student.studentNumber}
                                </p>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                {formatDate(payment.paymentDate)}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {payment.paymentMethod.replace('_', ' ')}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-700">
                                {naira(payment.amount)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => setPaymentToEdit(payment)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-white">
                                  <Pencil size={13} />
                                  Edit
                                </button>
                              </td>
                            </tr>)}
                          </tbody>
                        </table>
                      </div>
                {(paymentsQuery.data?.meta.total ?? 0) > 50 && <div className="flex items-center justify-between border-t border-gray-100 p-4 text-sm text-gray-500"><span>{paymentsQuery.data?.meta.total} payments</span><div className="flex gap-2"><button disabled={paymentPage <= 1} onClick={() => setPaymentPage((page) => page - 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Previous</button><span className="px-2 py-1.5">Page {paymentPage} of {paymentsQuery.data?.meta.totalPages}</span><button disabled={paymentPage >= (paymentsQuery.data?.meta.totalPages ?? 1)} onClick={() => setPaymentPage((page) => page + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Next</button></div></div>}
                {!paymentsQuery.data?.data.length && <p className="p-10 text-center text-sm text-gray-500">No payments have been recorded for this term.</p>}
              </>}
            </Card>
          )}

          {tab === 'fees' && (
            <section className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Fee structures
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Create school-wide or class-specific fees, then apply them to an academic cohort.
                  </p>
                </div>
                <Button onClick={() => setCreateFeeOpen(true)} disabled={!activeTermId}>
                  <Plus size={16} className="mr-2" />Create fee structure
                </Button>
              </div>
              {feeStructuresQuery.isLoading ? 
                <div className="flex h-52 items-center justify-center">
                  <Loader />
                </div> : 
                feeStructures.length ? 
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {feeStructures.map((structure) => 
                    <FeeCard key={structure.id} structure={structure} 
                    onAssign={() => setFeeToAssign(structure)} />)}
                </div> : 
                <Card>
                  <div className="py-12 text-center">
                    <Wallet className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-700">No fee structures for {activeTermLabel}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Create one to start tracking balances and collections.
                    </p>
                    <Button className="mt-4" 
                      onClick={() => setCreateFeeOpen(true)}
                    >
                      <Plus size={15} className="mr-2" />
                      Create fee structure
                    </Button>
                  </div>
                </Card>
              }
            </section>
          )}
        </>
      )}

      {createFeeOpen && 
        <CreateFeeStructureModal 
          termId={activeTermId} 
          termPeriod={activeTermLabel} 
          classes={classes} 
          onClose={() => setCreateFeeOpen(false)} 
          onSuccess={() => setCreateFeeOpen(false)} 
        />
      }
      {feeToAssign && 
        <AssignFeeModal 
          feeStructure={feeToAssign} 
          classes={classes.map(({ id, level }) => ({ id, level }))} 
          academicYears={academicYears.filter((year) => year.id === academicYearId)} 
          activeAcademicYearId={academicYearId} 
          onClose={() => setFeeToAssign(null)} 
          onSuccess={() => setFeeToAssign(null)} 
        />
      }
      {paymentToEdit && 
        <PaymentEditor 
          payment={paymentToEdit} 
          feeStructures={feeStructures} 
          onClose={() => setPaymentToEdit(null)} 
        />
      }
    </div>
  );
}

function SelectedStudentFinancialRecord({
  studentId,
  student,
  termId,
  termLabel,
  currentTermId,
  onEditPayment,
}: {
  studentId: string;
  student?: { id: string; firstName: string; lastName: string; studentNumber: string };
  termId: string;
  termLabel: string;
  currentTermId: string;
  onEditPayment: (payment: FeePayment) => void;
}) {
  const statementQuery = useStudentStatement(studentId, termId);
  const paymentHistoryQuery = usePaymentHistory(studentId);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const statement = statementQuery.data;

  return (
    <>
      <StudentFinancialRecord
        student={statement?.student ?? student}
        statement={statement}
        history={paymentHistoryQuery.data ?? []}
        isLoading={statementQuery.isLoading}
        historyLoading={paymentHistoryQuery.isLoading}
        statementError={statementQuery.isError}
        historyError={paymentHistoryQuery.isError}
        onRetryStatement={() => void statementQuery.refetch()}
        onRetryHistory={() => void paymentHistoryQuery.refetch()}
        currentTermId={currentTermId}
        onRecordPayment={() => setRecordPaymentOpen(true)}
        onEditPayment={onEditPayment}
      />
      {recordPaymentOpen && statement && (
        <RecordPaymentModal
          studentId={statement.student.id}
          studentName={`${statement.student.firstName} ${statement.student.lastName}`}
          studentNumber={statement.student.studentNumber}
          termId={termId}
          termLabel={termLabel}
          balances={statement.balances}
          onClose={() => setRecordPaymentOpen(false)}
          onSuccess={() => setRecordPaymentOpen(false)}
        />
      )}
    </>
  );
}


