import { Card } from "@/src/components/ui/Card";
import { useUpdateFeePaymentMutation } from "@/src/hooks/queries/useFees";
import { useToast } from "@/src/hooks/useToast";
import { FeePayment, FeeStructure, PaymentMethod, UpdateFeePaymentBody } from "@/src/types/fees";
import { Activity, GraduationCap, Pencil, Plus, Receipt, Users, Wallet } from "lucide-react";
import { type FormEvent, useState } from "react";
import { naira } from "../../bursar/components/methodbadge";
import { Button } from "@/src/components/ui/Button";
import { Loader } from "@/src/components/ui/Loader";

export type FinancialTab = 'overview' | 'students' | 'classes' | 'payments' | 'fees';
export const selectClass = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
export const tabs: { id: FinancialTab; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'classes', label: 'Classes', icon: GraduationCap },
  { id: 'payments', label: 'Payments', icon: Receipt },
  { id: 'fees', label: 'Fee structures', icon: Wallet },
];

export const formatDate = (value: string) => new Date(value).toLocaleDateString('en-GB', { dateStyle: 'medium' });
export function StudentFinancialRecord({
  student,
  statement,
  history,
  isLoading,
  historyLoading,
  statementError,
  historyError,
  onRetryStatement,
  onRetryHistory,
  currentTermId,
  onRecordPayment,
  onEditPayment,
}: {
  student?: { id: string; firstName: string; lastName: string; studentNumber: string };
  statement?: {
    student: { id: string; firstName: string; lastName: string; studentNumber: string; currentClass: { id: string; level: string } | null };
    balances: Array<{ id: string; amountDue: number; amountPaid: number; feeStructure: { name: string; amount: number; isOptional: boolean } }>;
    payments: FeePayment[];
    totalDue: number;
    totalPaid: number;
    outstanding: number;
  } | null;
  history: FeePayment[];
  isLoading: boolean;
  historyLoading: boolean;
  statementError: boolean;
  historyError: boolean;
  onRetryStatement: () => void;
  onRetryHistory: () => void;
  currentTermId: string;
  onRecordPayment: () => void;
  onEditPayment: (payment: FeePayment) => void;
}) {
  if (!student) return <Card><div className="flex h-full min-h-64 flex-col items-center justify-center text-center"><Users className="mb-3 text-gray-300" /><p className="font-semibold text-gray-800">Choose a student</p><p className="mt-1 max-w-xs text-sm text-gray-500">Select a student to see their fee balance, payment history, and record a payment.</p></div></Card>;
  if (isLoading) return <Card><div className="flex h-64 items-center justify-center"><Loader /></div></Card>;
  if (!statement) return <Card><div className="py-12 text-center"><p className="text-sm text-gray-500">{statementError ? 'Could not load this student’s financial statement.' : 'Student financial statement is unavailable for this term.'}</p>{statementError && <button onClick={onRetryStatement} className="mt-2 text-sm font-medium text-emerald-700 hover:underline">Try again</button>}</div></Card>;

  const outstanding = statement.outstanding;
  return <div className="space-y-4">
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Student account
            </p>
            <h2 className="mt-1 text-lg font-bold text-gray-900">
                {student.firstName} {student.lastName}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
                {student.studentNumber}
            </p>
        </div>
        <Button onClick={onRecordPayment}>
            <Plus size={15} className="mr-2" />Record payment
        </Button>
    </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Stat label="Total due" value={naira(statement.totalDue)} />
        <Stat label="Paid" value={naira(statement.totalPaid)} tone="green" />
        <Stat label="Outstanding" value={naira(outstanding)} tone={outstanding > 0 ? 'amber' : 'green'} /></div>
    </Card>
    <Card>
      <h3 className="font-semibold text-gray-900">Fee balances</h3>
      {statement.balances.length ? 
      <div className="mt-3 divide-y divide-gray-100">{statement.balances.map((balance) => <div key={balance.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div><p className="font-medium text-gray-800">{balance.feeStructure.name}</p><p className="text-xs text-gray-500">{balance.feeStructure.isOptional ? 'Optional fee' : 'Required fee'}</p></div><div className="text-right"><p className="font-semibold text-gray-900">{naira(balance.amountDue)}</p><p className="text-xs text-gray-500">{naira(balance.amountPaid)} paid</p></div></div>)}</div> : <p className="py-6 text-center text-sm text-gray-500">No fee balances are assigned for this term.</p>}
    </Card>
    <Card>
      <h3 className="font-semibold text-gray-900">Payment history</h3>
      {historyLoading ? <div className="flex h-20 items-center justify-center"><Loader /></div> : historyError ? <div className="py-6 text-center"><p className="text-sm text-gray-500">Could not load payment history.</p><button onClick={onRetryHistory} className="mt-2 text-sm font-medium text-emerald-700 hover:underline">Try again</button></div> : history.length ? 
        <div className="mt-3 divide-y divide-gray-100">
            {history.slice(0, 8).map((payment) => <div key={payment.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                        {payment.receiptNumber}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                        {formatDate(payment.paymentDate)} · {payment.term.period} · {payment.paymentMethod.replace('_', ' ')}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold text-emerald-700">
                        {naira(payment.amount)}
                    </span>
                    {payment.termId === currentTermId && 
                        <button onClick={() => onEditPayment(payment)} 
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" 
                            aria-label={`Edit receipt ${payment.receiptNumber}`}>
                                <Pencil size={14} />
                        </button>
                    }
                </div>
            </div>)}
        </div> : 
        <p className="py-6 text-center text-sm text-gray-500">No payments have been recorded for this student.</p>}
    </Card>
  </div>;
}

export function ClassFinancialOverview({ classLevel, rows, onSelectStudent }: { classLevel: string; rows: Array<{ studentId: string; name: string; studentNumber: string; totalDue: number; totalPaid: number; outstanding: number; isCleared: boolean }>; onSelectStudent: (studentId: string) => void }) {
  const due = rows.reduce((total, row) => total + row.totalDue, 0);
  const paid = rows.reduce((total, row) => total + row.totalPaid, 0);
  const outstanding = rows.reduce((total, row) => total + row.outstanding, 0);
  return <>
    <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Students with accounts" value={String(rows.length)} />
        <Stat label="Collected" value={naira(paid)} tone="green" />
        <Stat label="Outstanding" value={naira(outstanding)} tone={outstanding ? 'amber' : 'green'} />
    </div>
    <Card className="overflow-hidden p-0"><div className="border-b border-gray-100 p-4"><h3 className="font-semibold text-gray-900">{classLevel} fee ledger</h3><p className="mt-1 text-xs text-gray-500">Total assessed: {naira(due)}</p></div><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3 text-right">Due</th><th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3 text-right">Outstanding</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-gray-100">{rows.map((row) => <tr key={row.studentId} className="hover:bg-gray-50"><td className="px-4 py-3"><button onClick={() => onSelectStudent(row.studentId)} className="text-left"><span className="block font-medium text-gray-900 hover:text-emerald-700">{row.name}</span><span className="text-xs text-gray-500">{row.studentNumber}</span></button></td><td className="px-4 py-3 text-right">{naira(row.totalDue)}</td><td className="px-4 py-3 text-right font-medium text-emerald-700">{naira(row.totalPaid)}</td><td className="px-4 py-3 text-right font-semibold">{naira(row.outstanding)}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.isCleared ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{row.isCleared ? 'Cleared' : 'Balance due'}</span></td></tr>)}</tbody></table></div>{!rows.length && <p className="p-10 text-center text-sm text-gray-500">No fee balances are assigned to this class for the selected year.</p>}</Card>
  </>;
}

export function PaymentEditor({ payment, feeStructures, onClose }: { payment: FeePayment; feeStructures: FeeStructure[]; onClose: () => void }) {
  const mutation = useUpdateFeePaymentMutation();
  const { error: showError } = useToast();
  const [amount, setAmount] = useState(String(payment.amount));
  const [paymentDate, setPaymentDate] = useState(payment.paymentDate.slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(payment.paymentMethod);
  const [feeStructureId, setFeeStructureId] = useState(payment.feeStructureId ?? '');
  const [note, setNote] = useState(payment.note ?? '');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      showError('Enter a payment amount greater than zero.');
      return;
    }
    const body: UpdateFeePaymentBody = { amount: amountValue, paymentDate, paymentMethod, feeStructureId: feeStructureId || null, note: note.trim() || null };
    mutation.mutate({ paymentId: payment.id, body }, { onSuccess: onClose });
  };
  const methods: PaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'POS', 'ONLINE'];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
         onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                            Edit payment
                        </p>
                        <h2 className="mt-1 text-lg font-bold text-gray-900">{payment.receiptNumber}</h2>
                        <p className="text-sm text-gray-500">
                            {payment.student.firstName} {payment.student.lastName} · {payment.student.studentNumber}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100">
                        Close
                    </button>
                </div>
                <label className="block text-sm font-medium text-gray-700">
                    Amount
                    <input type="number" min="0.01" step="0.01" 
                    required value={amount} 
                    onChange={(event) => setAmount(event.target.value)} 
                    className={selectClass + ' mt-1.5'} />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Payment date
                    <input type="date" 
                        required value={paymentDate} 
                        onChange={(event) => setPaymentDate(event.target.value)} 
                        className={selectClass + ' mt-1.5'} 
                    />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                        Method
                        <select value={paymentMethod} 
                            onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} 
                            className={selectClass + ' mt-1.5'}
                        >
                            {methods.map((method) => 
                                <option key={method} value={method}>{method.replace('_', ' ')}
                                </option>)}
                        </select>
                    </label>
                </div>
                <label className="block text-sm font-medium text-gray-700">
                    Applied fee
                    <select value={feeStructureId} 
                        onChange={(event) => setFeeStructureId(event.target.value)} 
                        className={selectClass + ' mt-1.5'}>
                        <option value="">
                            General payment
                        </option>
                        {feeStructures.map((structure) => 
                        <option key={structure.id} value={structure.id}>
                            {structure.name}
                        </option>)}
                    </select>
                </label>
                <label className="block text-sm font-medium text-gray-700">
                    Note
                    <textarea value={note} 
                        onChange={(event) => setNote(event.target.value)}
                        maxLength={500} rows={3} className={selectClass + ' mt-1.5'} 
                    />
                </label>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </div>;
}

export function Stat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'green' | 'amber' }) {
    return <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">
                {label}
            </p>
            <p className={`mt-2 truncate text-lg font-bold ${tone === 'green' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : 'text-gray-900'}`}>
                {value}
            </p>
        </div>;
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return<Card>
            <div className="py-10 text-center">
                <p className="text-sm text-gray-600">
                    {message}
                </p>
                <button onClick={onRetry} className="mt-3 text-sm font-medium text-emerald-700 hover:underline">
                    Try again
                </button>
            </div>
        </Card>;
}
