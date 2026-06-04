'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateSubjectMutation } from '@/src/hooks/queries/useAdmin';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { X } from 'lucide-react';

const createSubjectSchema = z.object({
  name: z.string().min(2, 'Subject name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
});

type CreateSubjectFormData = z.infer<typeof createSubjectSchema>;

interface CreateSubjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSubjectModal({ onClose, onSuccess }: CreateSubjectModalProps) {
  const createSubjectMutation = useCreateSubjectMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateSubjectFormData>({
    resolver: zodResolver(createSubjectSchema),
  });

  const onSubmit = async (data: CreateSubjectFormData) => {
    await createSubjectMutation.mutateAsync({
      name: data.name,
      code: data.code,
      description: data.description,
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Create New Subject</h2>
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
              Subject Name *
            </label>
            <Input
              {...register('name')}
              placeholder="e.g., Mathematics"
              error={errors.name?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Code
            </label>
            <Input
              {...register('code')}
              placeholder="e.g., MATH101"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Brief description"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows={3}
            />
          </div>

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
              loading={createSubjectMutation.isPending}
            >
              Create Subject
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
