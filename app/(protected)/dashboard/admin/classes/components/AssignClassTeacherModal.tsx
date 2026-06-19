'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useAssignClassTeacherMutation } from '@/src/hooks/queries/useAdmin';
import { useActiveAcademicYear } from '@/src/hooks/queries/useAcademic';
import { useAuthStore } from '@/src/stores/authStore';
import { TeacherCombobox } from '../../subjects/components/ComboBox';
import { SelectedTeacher } from '@/src/utils/teacher';

interface AssignClassTeacherModalProps {
  classLevel: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Calls POST /schools/:schoolId/classes/teacher (assignClassTeacher)
 * Body: { teacherEmployeeNumber, isClassTeacher, academicYearLabel, level }
 *
 * academicYearLabel defaults to the currently active academic year so the
 * admin doesn't have to type it for the common case, but stays editable in
 * case they're assigning ahead for a year that hasn't started yet.
 */
export default function AssignClassTeacherModal({
  classLevel,
  onClose,
  onSuccess,
}: AssignClassTeacherModalProps) {
    const schoolId = useAuthStore((state) => state.user?.schoolId ?? ''); 
  const { data: activeYear } = useActiveAcademicYear(schoolId);
  console.log(activeYear?.label)

  const [selectedTeacher, setSelectedTeacher] = useState<SelectedTeacher | null>(null);
  const [academicYearLabel, setAcademicYearLabel] = useState(activeYear?.label);
  const [isClassTeacher, setIsClassTeacher] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useAssignClassTeacherMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTeacher) {
      setError('Enter the teacher\u2019s employee number.');
      return;
    }
    if (!academicYearLabel) {
      setError('Enter an academic year (e.g. "2025/2026").');
      return;
    }

    mutate(
      {
        teacherEmployeeNumber: selectedTeacher.employeeNumber,
        isClassTeacher,
        academicYearLabel: academicYearLabel,
        level: classLevel,
      },
      {
        onSuccess: () => onSuccess(),
        onError: (err: any) => {
          setError(err?.response?.data?.error ?? 'Could not assign teacher. Try again.');
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Assign Class Teacher</h2>
            <p className="text-sm text-gray-500">For {classLevel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Teacher Employee Number
            </label> 
            <TeacherCombobox value={selectedTeacher} onChange={setSelectedTeacher} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Academic Year
            </label>
            <Input
              placeholder="e.g. 2025/2026"
              value={academicYearLabel}
              onChange={(e) => setAcademicYearLabel(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isClassTeacher}
              onChange={(e) => setIsClassTeacher(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Set as primary class teacher (form teacher)
            </span>
          </label>
          <p className="text-xs text-gray-400 -mt-2 pl-6.5">
            Uncheck this if you're only recording a co-assignment without making
            them the form teacher.
          </p>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isPending}>
              {isPending ? 'Assigning...' : 'Assign Teacher'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
