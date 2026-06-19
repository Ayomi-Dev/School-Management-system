'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { useAssignSubjectTeacherMutation } from '@/src/hooks/queries/useAdmin';
import { TeacherCombobox } from './ComboBox';
import { SelectedTeacher } from '@/src/utils/teacher';

interface AssignSubjectTeacherModalProps {
  subjectName: string;
  classLevel: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Calls POST /schools/:schoolId/teachers/subjects (assignSubject)
 * Body: { subjectName, level, teacherNumber }
 *
 * subjectName and level are pre-filled from the row the admin clicked,
 * read-only here. Teacher selection now happens through a searchable
 * combobox over GET /teachers (listAllTeachers) instead of free-text entry,
 * so the admin can't typo an employee number into a 404.
 */
export default function AssignSubjectTeacherModal({
  subjectName,
  classLevel,
  onClose,
  onSuccess,
}: AssignSubjectTeacherModalProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<SelectedTeacher | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useAssignSubjectTeacherMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTeacher) {
      setError('Select a teacher to assign.');
      return;
    }

    mutate(
      {
        subjectName,
        level: classLevel,
        teacherNumber: selectedTeacher.employeeNumber,
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
            <h2 className="text-lg font-bold text-gray-900">Assign Subject Teacher</h2>
            <p className="text-sm text-gray-500">
              {subjectName} &middot; {classLevel}
            </p>
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
              Teacher
            </label>
            <TeacherCombobox value={selectedTeacher} onChange={setSelectedTeacher} />
            <p className="text-xs text-gray-400 mt-1.5">
              Assigns for the current active term. Re-assigning later for a new
              term will update this automatically.
            </p>
          </div>

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
