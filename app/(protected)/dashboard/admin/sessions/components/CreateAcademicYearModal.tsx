'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateAcademicYearMutation } from '@/src/hooks/queries/useAdmin';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { X } from 'lucide-react';

const createAcademicYearSchema = z.object({
  name: z.string().min(4, 'Academic year name is required (e.g., 2024-2025)'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean().optional(),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  {
    message: 'Start date must be before end date',
    path: ['endDate'],
  }
);

type CreateAcademicYearFormData = z.infer<typeof createAcademicYearSchema>;

interface CreateAcademicYearModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAcademicYearModal({ onClose, onSuccess }: CreateAcademicYearModalProps) {
  const createAcademicYearMutation = useCreateAcademicYearMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateAcademicYearFormData>({
    resolver: zodResolver(createAcademicYearSchema),
    defaultValues: {
      isActive: false,
    },
  });

  const onSubmit = async (data: CreateAcademicYearFormData) => {
    await createAcademicYearMutation.mutateAsync({
      name: data.name,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      isActive: data.isActive,
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Create Academic Year</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year Name *
            </label>
            <Input
              {...register('name')}
              placeholder="e.g., 2024-2025"
              error={errors.name?.message}
            />
          </div>

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
              {...register('isActive')}
              id="isActive"
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Set as active academic year
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
              loading={createAcademicYearMutation.isPending}
            >
              Create Year
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
