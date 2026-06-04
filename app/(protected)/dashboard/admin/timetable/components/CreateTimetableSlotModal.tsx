'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { X } from 'lucide-react';

const createTimetableSlotSchema = z.object({
  dayOfWeek: z.string().min(1, 'Day is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  subject: z.string().min(1, 'Subject is required'),
  teacher: z.string().min(1, 'Teacher is required'),
  room: z.string().optional(),
});

type CreateTimetableSlotFormData = z.infer<typeof createTimetableSlotSchema>;

interface CreateTimetableSlotModalProps {
  classId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTimetableSlotModal({
  classId,
  onClose,
  onSuccess,
}: CreateTimetableSlotModalProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateTimetableSlotFormData>({
    resolver: zodResolver(createTimetableSlotSchema),
  });

  const onSubmit = async (data: CreateTimetableSlotFormData) => {
    // TODO: Call mutation
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Add Timetable Slot</h2>
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
              Day *
            </label>
            <select
              {...register('dayOfWeek')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select day</option>
              <option value="MONDAY">Monday</option>
              <option value="TUESDAY">Tuesday</option>
              <option value="WEDNESDAY">Wednesday</option>
              <option value="THURSDAY">Thursday</option>
              <option value="FRIDAY">Friday</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <Input type="time" {...register('startTime')} error={errors.startTime?.message} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <Input type="time" {...register('endTime')} error={errors.endTime?.message} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <select
              {...register('subject')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select subject</option>
              <option value="MATH">Mathematics</option>
              <option value="ENG">English</option>
              <option value="SCI">Science</option>
              <option value="HIS">History</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teacher *
            </label>
            <select
              {...register('teacher')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select teacher</option>
              <option value="teacher-1">John Smith</option>
              <option value="teacher-2">Jane Doe</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room
            </label>
            <Input {...register('room')} placeholder="e.g., A1" />
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
            <Button type="submit" variant="primary" className="flex-1">
              Add Slot
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
