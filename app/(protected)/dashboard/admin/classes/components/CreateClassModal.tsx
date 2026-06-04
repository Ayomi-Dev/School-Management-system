'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateClassMutation } from '@/src/hooks/queries/useAdmin';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { X } from 'lucide-react';
import { CreateClassInput, createClassSchema } from '@/src/validators/classSchema';
import { ClassLevel } from '@/src/types';

 

;

interface CreateClassModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateClassModal({ onClose, onSuccess }: CreateClassModalProps) {
  const createClassMutation = useCreateClassMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateClassInput>({
    resolver: zodResolver(createClassSchema),
  });
  const levels = ["CRECHE" , "NURSERY1" , "NURSERY2"
  , "PRIMARY1" , "PRIMARY2" , "PRIMARY3" , "PRIMARY4" , "PRIMARY5" , "PRIMARY6"
  , "JSS1" , "JSS2" , "JSS3"
  , "SS1" , "SS2" , "SS3"
  ]
  const depts = ["ART", "COMMERCIAL", "SCIENCE"]
  const onSubmit = async (data: CreateClassInput) => {
    await createClassMutation.mutateAsync({
      name: data.name,
      level: data.level,
      order: data.order,
      department: data.department 
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Create New Class</h2>
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
              Class Name *
            </label>
            <Input
              {...register('name')}
              placeholder="e.g., Form 1A"
              error={errors.name?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level *
            </label>
            <select
              {...register('level')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select level</option>
              {levels.map(lev => (
                <option key={lev} value={lev}>{lev}</option>
              ))}
              
            </select>
          </div>
          <div>
            <select
              {...register('level')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select Department</option>
              {depts.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
              
            </select>
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
              loading={createClassMutation.isPending}
            >
              Create Class
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
