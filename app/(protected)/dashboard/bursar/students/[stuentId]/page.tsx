'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader } from '@/src/components/ui/Loader';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import {
  ArrowLeft,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { usePaymentHistory, useStudentStatement } from '@/src/hooks/queries/useFees';
import RecordPaymentModal from '../../components/modals/RecordPayment';
import { useCurrentTerm } from '@/src/hooks/queries/useAcademic';

function naira(n: number) {
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const METHOD_COLORS: Record<string, string> = {
  CASH:          'bg-emerald-100 text-emerald-700',
  BANK_TRANSFER: 'bg-blue-100    text-blue-700',
  CARD:          'bg-violet-100  text-violet-700',
  CHEQUE:        'bg-amber-100   text-amber-700',
  ONLINE:        'bg-cyan-100    text-cyan-700',
};

type Tab = 'statement' | 'history';



export default function StudentStatementPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const router        = useRouter();
  const { termId, termPeriod } = useCurrentTerm()

  const [tab, setTab]  = useState<Tab>('statement');
  const [paymentOpen, setPaymentOpen] = useState(false);

  
  const {
    data,
    isLoading: statementLoading,
    isError: statementError,
  } = useStudentStatement(studentId, termId);

  const {
    data: history = [],
    isLoading: historyLoading,
  } = usePaymentHistory(studentId, tab === 'history');

  if (statementLoading) {
    return <div className="flex items-center justify-center h-80"><Loader /></div>;
  }
  if (statementError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm text-gray-500">Could not load student record.</p>
        <Button variant="outline" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const { student, balances, payments, totalDue, totalPaid, outstanding } = data;
  const isCleared = outstanding <= 0;
  const pct       = totalDue > 0 ? Math.min((totalPaid / totalDue) * 100, 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={15} />
        Back
      </button>

      {/* Student header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {student.firstName} {student.lastName}
              </h1>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-gray-500 mt-0.5">
                <span>{student.studentNumber}</span>
                {student.currentClass && <span>· {student.currentClass.level}</span>}
                <span>· {termPeriod}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isCleared ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700 bg-emerald-100 px-4 py-2 rounded-full font-medium">
                <CheckCircle2 size={15} />
                Cleared
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-amber-700 bg-amber-100 px-4 py-2 rounded-full font-medium">
                <Clock size={15} />
                Outstanding
              </span>
            )}
            <Button
              variant="primary"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setPaymentOpen(true)}
            >
              <Plus size={15} />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Summary numbers */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: 'Total Due',    value: naira(totalDue),   color: 'text-gray-900'    },
            { label: 'Total Paid',   value: naira(totalPaid),  color: 'text-emerald-700' },
            { label: 'Outstanding',  value: naira(outstanding), color: outstanding > 0 ? 'text-red-600' : 'text-emerald-700' },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {totalDue > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">Payment progress</span>
              <span className="text-xs font-semibold text-emerald-700">{pct.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isCleared ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {([
            { id: 'statement' as Tab, label: 'Fee Statement' },
            { id: 'history'   as Tab, label: `Payment History (${payments.length})` },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Statement tab */}
      {tab === 'statement' && (
        <Card>
          {balances.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              No fee balances assigned for this term.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-full">Fee</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Due</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Paid</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Outstanding</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {balances.map((b) => {
                    const owed    = b.amountDue - b.amountPaid;
                    const cleared = owed <= 0;
                    return (
                      <tr key={b.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{b.feeStructure.name}</p>
                          {b.feeStructure.isOptional && (
                            <p className="text-[10px] text-gray-400">Optional</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">{naira(b.amountDue)}</td>
                        <td className="px-4 py-3 text-center text-emerald-700 font-medium">{naira(b.amountPaid)}</td>
                        <td className={`px-4 py-3 text-center font-bold ${cleared ? 'text-emerald-600' : 'text-red-600'}`}>
                          {naira(owed)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {cleared ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                              <CheckCircle2 size={10} />Cleared
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                              <Clock size={10} />Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900">{naira(totalDue)}</td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-700">{naira(totalPaid)}</td>
                    <td className={`px-4 py-3 text-center font-black ${outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {naira(outstanding)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <Card>
          {historyLoading ? (
            <div className="flex items-center justify-center h-40"><Loader /></div>
          ) : history?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No payments recorded yet.</p>
          ) : (
            <div className="space-y-0">
              {history?.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 py-3.5 ${i !== 0 ? 'border-t border-gray-50' : ''}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Receipt size={15} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{naira(p.amount)}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${METHOD_COLORS[p.paymentMethod] ?? 'bg-gray-100 text-gray-600'}`}>
                        {p.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span>{p.receiptNumber}</span>
                      <span>·</span>
                      <span>{p.term?.period}</span>
                      {p.note && <><span>·</span><span className="italic">{p.note}</span></>}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">
                    {new Date(p.paymentDate).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Record payment modal */}
      {paymentOpen && (
        <RecordPaymentModal
          studentId={studentId}
          studentName={`${student.firstName} ${student.lastName}`}
          studentNumber={student.studentNumber}
          termId={termId}
          termLabel={termPeriod}
          balances={balances}
          onClose={() => setPaymentOpen(false)}
          onSuccess={() => setPaymentOpen(false)}
        />
      )}
    </div>
  );
}