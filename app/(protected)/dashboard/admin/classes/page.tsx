'use client';

import { useState, useMemo } from 'react';
import { useClassesList, useCreateClassMutation } from '@/src/hooks/queries/useAdmin';
import { Card } from '@/src/components/ui/Card';
import { DataTable } from '@/src/components/ui/DataTable';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';
import { Edit2, Trash2, Plus, Users } from 'lucide-react';
import CreateClassModal from './components/CreateClassModal';

export default function ClassesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');

  const { data: classesData, isLoading } = useClassesList({
    academicYearId: selectedAcademicYear || undefined,
  });

  const classes = useMemo(() => classesData?.data || [], [classesData]);
  console.log("class all in school",classes)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes Management</h1>
          <p className="text-gray-600 mt-1">Create and manage school classes</p>
        </div>
        <Button
          variant="primary"
          className="flex items-center gap-2"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={18} />
          Create Class
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Years</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader />
        </div>
      ) : classes.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.data.map((classItem: any) => (
            <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Class Header */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{classItem.name}</h3>
                  <p className="text-sm text-gray-600">Level: {classItem.level}</p>
                </div>

                {/* Class Details */}
                <div className="space-y-2 py-4 border-y border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Teacher:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {classItem.classTeacher?.firstName} {classItem.classTeacher?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Capacity:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {classItem.capacity || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Academic Year:</span>
                    <span className="text-sm font-medium text-gray-900">
                      2024-2025
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
                    <span>{classItem._count.enrollments}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit2 size={16} /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-red-600">
                    <Trash2 size={16} /> Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">No classes created yet</p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create First Class
            </Button>
          </div>
        </Card>
      )}

      {/* Modal */}
      {isCreateModalOpen && (
        <CreateClassModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}
