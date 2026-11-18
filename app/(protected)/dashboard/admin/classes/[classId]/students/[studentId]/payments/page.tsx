'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { usePaymentHistory } from '@/src/hooks/queries/useFees';
import { useTerms } from '@/src/hooks/queries/useAcademic';
import { Card } from '@/src/components/ui/Card';
import { Loader } from '@/src/components/ui/Loader';

export default function StudentPaymentHistoryPage() {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const router = useRouter();
  const [termId, setTermId] = useState('');
  const { data: payments = [], isLoading, isError } = usePaymentHistory(studentId, true, termId || undefined);
  const { data: terms = [] } = useTerms();

  if (isLoading) return <div className="flex min-h-80 items-center justify-center"><Loader /></div>;
  if (isError) return <Card><p className="py-10 text-center text-sm text-red-600">Could not load payment history.</p></Card>;

  const student = payments[0]?.student;
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <button onClick={() => router.push(`/dashboard/admin/classes/${classId}`)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={16} />Back to class</button>
      <Card>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900"><CreditCard size={22} />Payment History</h1>
        <p className="mt-1 text-sm text-gray-500">{student ? `${student.firstName} ${student.lastName} · ${student.studentNumber}` : 'Student payment transactions'}</p>
        <label className="mt-4 flex max-w-sm flex-col gap-1 text-xs font-medium uppercase tracking-wide text-gray-500">Term / session
          <select value={termId} onChange={(event) => setTermId(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-800">
            <option value="">All sessions</option>
            {terms?.map((term) => <option key={term.id} value={term.id}>{term.period} — {term.academicYear?.label ?? ''}</option>)}
          </select>
        </label>
      </Card>
      <Card className="overflow-hidden p-0!">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Receipt</th><th className="px-4 py-3">Session</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Note</th><th className="px-4 py-3 text-right">Amount</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => <tr key={payment.id}><td className="px-4 py-3 whitespace-nowrap">{new Date(payment.paymentDate).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</td><td className="px-4 py-3 font-medium">{payment.receiptNumber}</td><td className="px-4 py-3">{payment.term.period} — {payment.term.academicYear?.label ?? ''}</td><td className="px-4 py-3">{payment.paymentMethod.replace('_', ' ')}</td><td className="px-4 py-3">{payment.status.replace('_', ' ')}</td><td className="px-4 py-3 text-gray-500">{payment.note || '—'}</td><td className="px-4 py-3 text-right font-semibold">₦{payment.amount.toLocaleString()}</td></tr>)}
              {payments.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No payments recorded for this session.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
