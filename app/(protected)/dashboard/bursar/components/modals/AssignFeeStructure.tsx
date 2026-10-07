'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Users } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

import {useAssignFeeToClassMutation} from '@/src/hooks/queries/useFees';
import type { FeeStructure } from '@/src/types/fees';
import { assignFeeSchema, AssignFormData } from '@/src/validators/feePaymentSchema';
import { selectClass } from '../methodbadge';
import { AcademicYear } from '@/src/types';


interface AssignFeeModalProps {
  feeStructure:   FeeStructure;
  classes:        Array<{ id: string; level: string }>;
  academicYears:  AcademicYear[];
  onClose:        () => void;
  onSuccess:      () => void;
}

export function AssignFeeModal({
  feeStructure,
  classes,
  academicYears,
  onClose,
  onSuccess,
}: AssignFeeModalProps) {
  const mutation = useAssignFeeToClassMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignFormData>({
    resolver: zodResolver(assignFeeSchema),
    defaultValues: {
      classId:        feeStructure.classId ?? '',
      academicYearId: academicYears[0]?.id ?? '',
    },
  });

  const onSubmit = (data: AssignFormData) => {
    mutation.mutate(
      { feeStructureId: feeStructure.id, body: data },
      { onSuccess },
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <Users size={17} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Assign to Class</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {feeStructure.name} — ₦{feeStructure.amount.toLocaleString()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={17} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
            This creates a fee balance for every student currently enrolled in the selected class.
            Existing balances are not overwritten.
          </p>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Class *</label>
            <select {...register('classId')} className={selectClass}>
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.level}</option>
              ))}
            </select>
            {errors.classId && <p className="text-xs text-red-500 mt-1">{errors.classId.message}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Academic Year *</label>
            <select {...register('academicYearId')} className={selectClass}>
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>{ay.label}</option>
              ))}
            </select>
            {errors.academicYearId && (
              <p className="text-xs text-red-500 mt-1">{errors.academicYearId.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Assigning…' : 'Assign Fee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}