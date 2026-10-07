'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Receipt, AlertCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useRecordPaymentMutation } from '@/src/hooks/queries/useFees';
import type { PaymentMethod, FeeBalance } from '@/src/types/fees';
import { selectClass } from '../methodbadge';
import { RecordPaymentFormData, recordPaymentSchema } from '@/src/validators/feePaymentSchema';


const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH',          label: 'Cash'          },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'POS',        label: 'POS'        },
  { value: 'ONLINE',        label: 'Online'        },
];


interface Props {
  studentId:     string;
  studentName:   string;
  studentNumber: string;
  termId:        string;
  termLabel:     string;
  balances:      FeeBalance[];   // existing balances for the quick-fill dropdown
  onClose:       () => void;
  onSuccess:     () => void;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function RecordPaymentModal({
  studentId,
  studentName,
  studentNumber,
  termId,
  termLabel,
  balances,
  onClose,
  onSuccess,
}: Props) {
  const mutation = useRecordPaymentMutation(studentId, termId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecordPaymentFormData>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      paymentDate:   new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
    },
  });

  const selectedFeeId = watch('feeStructureId');

  // When a fee structure is selected, pre-fill the amount with what's outstanding
  useEffect(() => {
    if (!selectedFeeId) return;
    const bal = balances.find((b) => b.feeStructureId === selectedFeeId);
    if (bal) {
      const outstanding = bal.amountDue - bal.amountPaid;
      if (outstanding > 0) setValue('amount', outstanding);
    }
  }, [selectedFeeId, balances, setValue]);

  const onSubmit = (data: RecordPaymentFormData) => {
    mutation.mutate(
      { ...data, studentId, termId },
      { onSuccess },
    );
  };

  const outstandingTotal = balances.reduce((s, b) => s + (b.amountDue - b.amountPaid), 0);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Receipt size={17} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Record Payment</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {studentName} · {studentNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={17} className="text-gray-400" />
          </button>
        </div>

        {/* Outstanding summary */}
        {outstandingTotal > 0 && (
          <div className="mx-6 mt-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">Outstanding balance</span>
            </div>
            <span className="text-sm font-bold text-amber-800">
              ₦{outstandingTotal.toLocaleString()}
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Fee structure (optional — payment can be general) */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Applied to (optional)
            </label>
            <select {...register('feeStructureId')} className={selectClass}>
              <option value="">General payment — not tied to a specific fee</option>
              {balances.map((b) => {
                const outstanding = b.amountDue - b.amountPaid;
                return (
                  <option key={b.feeStructureId} value={b.feeStructureId}>
                    {b.feeStructure.name} — ₦{outstanding.toLocaleString()} outstanding
                  </option>
                );
              })}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Amount (₦) *</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount')}
              error={errors.amount?.message}
            />
          </div>

          {/* Date + method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Payment Date *</label>
              <Input type="date" {...register('paymentDate')} error={errors.paymentDate?.message} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Method *</label>
              <select {...register('paymentMethod')} className={selectClass}>
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Note (optional)</label>
            <textarea
              {...register('note')}
              placeholder="e.g. Part payment for second term fees"
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={mutation.isPending}>
              {mutation.isPending ? 'Recording…' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}