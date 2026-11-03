'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { X } from 'lucide-react';
import { TermPeriod } from '@prisma/client';
import { useCreateTermMutation } from '@/src/hooks/queries/useAcademic';
import { createTermFormSchema } from '@/src/validators/academicSchema';


type CreateTermFormData = z.infer<typeof createTermFormSchema>;

interface CreateTermProps {
  academicYearId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTermModal({ academicYearId, onClose, onSuccess }: CreateTermProps) {
  const createTermMutation = useCreateTermMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateTermFormData>({
    resolver: zodResolver(createTermFormSchema),
    defaultValues: {
      isCurrent: false,
    },
  });
  const termPeriods = Object.values(TermPeriod).map((v) => ({
    value: v,
    label: v,
  }));
  console.log("academicYearId:", academicYearId)

  const onSubmit = async (data: CreateTermFormData) => {
    if (!academicYearId) return;
    await createTermMutation.mutateAsync({
      period: data.period,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      academicYearId,
      isCurrent: data.isCurrent,
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Create Term</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit, (errs) => console.log("form invalid:", errs))} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term Name
            </label>
            <select
              {...register('period')}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Select a term</option>
              {termPeriods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.value}
                </option>
              ))}
            </select>
            {errors.period && <p className="mt-1 text-sm text-red-600">{errors.period.message}</p>}
          </div>

          {!academicYearId && (
            <p className="text-sm text-red-600">
              Select an academic year before adding a term.
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <Input
              type="date"
              {...register('startDate')}
              error={errors.startDate?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <Input
              type="date"
              {...register('endDate')}
              error={errors.endDate?.message}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <input
              type="checkbox"
              {...register('isCurrent')}
              id="isCurrent"
              className="rounded"
            />
            <label htmlFor="isCurrent" className="text-sm font-medium text-gray-700">
              Set as active term (this will make this term the current active term for the academic year)
            </label>
          </div>

          {errors.root && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.root.message}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={createTermMutation.isPending}
              disabled={!academicYearId}
            >
              Create Term
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
