'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loader } from '@/src/components/ui/Loader';
import { X, AlertCircle } from 'lucide-react';

import type { TimetableSlot, DayOfWeek } from '@/src/types/timetable';
import { useClassTeachers, useCreateSlotMutation, useUpdateSlotMutation } from '@/src/hooks/queries/useAdmin';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Required'),
  endTime:   z.string().regex(/^\d{2}:\d{2}$/, 'Required'),
  subjectId: z.string().min(1, 'Subject is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  room:      z.string().trim().max(20).optional(),
}).refine((d) => d.startTime < d.endTime, {
  message: 'End time must be after start time',
  path:    ['endTime'],
});

type FormData = z.infer<typeof schema>;

// ─── Day labels ───────────────────────────────────────────────────────────────

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'MONDAY',    label: 'Monday'    },
  { value: 'TUESDAY',   label: 'Tuesday'   },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY',  label: 'Thursday'  },
  { value: 'FRIDAY',    label: 'Friday'    },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  classId:   string;
  // When passed, the modal opens in edit mode pre-filled with the slot's data
  editSlot?: TimetableSlot;
  // Pre-fill the day and startTime when the admin clicks an empty cell
  prefillDay?:       DayOfWeek;
  prefillStartTime?: string;
  onClose:   () => void;
  onSuccess: () => void;
}

// ─── Select styling ───────────────────────────────────────────────────────────

const selectClass =
  'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white';

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function TimetableSlotModal({
  classId,
  editSlot,
  prefillDay,
  prefillStartTime,
  onClose,
  onSuccess,
}: Props) {
  const isEdit = !!editSlot;

  // Fetch teachers only when modal is open
  const { data: teachers = [], isLoading: teachersLoading } = useClassTeachers(classId, true);

  const createMutation = useCreateSlotMutation(classId);
  const updateMutation = useUpdateSlotMutation(classId);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dayOfWeek: editSlot?.dayOfWeek ?? prefillDay ?? 'MONDAY',
      startTime: editSlot?.startTime ?? prefillStartTime ?? '',
      endTime:   editSlot?.endTime   ?? '',
      subjectId: editSlot?.subject.id ?? '',
      teacherId: editSlot?.teacher.id ?? '',
      room:      editSlot?.room ?? '',
    },
  });

  // When a teacher is selected, derive available subjects from their assignment list
  const selectedTeacherId = watch('teacherId');
  const selectedTeacher   = teachers.find((t) => t.teacherProfileId === selectedTeacherId);

  // Reset form if editSlot changes (e.g. admin switches which slot to edit)
  useEffect(() => {
    if (editSlot) {
      reset({
        dayOfWeek: editSlot.dayOfWeek,
        startTime: editSlot.startTime,
        endTime:   editSlot.endTime,
        subjectId: editSlot.subject.id,
        teacherId: editSlot.teacher.id,
        room:      editSlot.room ?? '',
      });
    }
  }, [editSlot, reset]);

  const onSubmit = (data: FormData) => {
    if (isEdit && editSlot) {
      updateMutation.mutate(
        { slotId: editSlot.id, body: data },
        { onSuccess },
      );
    } else {
      createMutation.mutate(data, { onSuccess });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {isEdit ? 'Edit Slot' : 'Add Timetable Slot'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? 'Update the slot details below' : 'Fill in the details for the new slot'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Day */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Day *</label>
            <select {...register('dayOfWeek')} className={selectClass}>
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            {errors.dayOfWeek && (
              <p className="text-xs text-red-500 mt-1">{errors.dayOfWeek.message}</p>
            )}
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Start Time *</label>
              <Input type="time" {...register('startTime')} error={errors.startTime?.message} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">End Time *</label>
              <Input type="time" {...register('endTime')} error={errors.endTime?.message} />
            </div>
          </div>

          {/* Teacher — loads subjects scoped to this teacher */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Teacher *</label>
            {teachersLoading ? (
              <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
                <Loader /> Loading teachers…
              </div>
            ) : teachers.length === 0 ? (
              <div className="flex items-center gap-2 py-2 text-sm text-amber-600 bg-amber-50 rounded-xl px-3">
                <AlertCircle size={14} />
                No subject teachers assigned to this class yet.
              </div>
            ) : (
              <select {...register('teacherId')} className={selectClass}>
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t.teacherProfileId} value={t.teacherProfileId}>
                    {t.firstName} {t.lastName}
                    {t.subjects.length > 0 && ` — ${t.subjects.map((s) => s.name).join(', ')}`}
                  </option>
                ))}
              </select>
            )}
            {errors.teacherId && (
              <p className="text-xs text-red-500 mt-1">{errors.teacherId.message}</p>
            )}
          </div>

          {/* Subject — filtered to the selected teacher's subjects */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Subject *</label>
            <select
              {...register('subjectId')}
              disabled={!selectedTeacherId}
              className={`${selectClass} disabled:bg-gray-50 disabled:text-gray-400`}
            >
              <option value="">
                {selectedTeacherId ? 'Select subject' : 'Select a teacher first'}
              </option>
              {(selectedTeacher?.subjects ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.subjectId && (
              <p className="text-xs text-red-500 mt-1">{errors.subjectId.message}</p>
            )}
          </div>

          {/* Room */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Room</label>
            <Input {...register('room')} placeholder="e.g. A1, Lab 2, Main Hall" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isPending || teachersLoading}>
              {isPending ? (isEdit ? 'Saving…' : 'Adding…') : (isEdit ? 'Save Changes' : 'Add Slot')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
