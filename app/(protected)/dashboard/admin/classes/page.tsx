'use client';

import { useState, useMemo } from 'react';
import { useClassesList, useAcademicYearsList } from '@/src/hooks/queries/useAdmin';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';
import { Edit2, Trash2, Plus, Users, Book } from 'lucide-react';
import CreateClassModal from './components/CreateClassModal';

export default function ClassesPage() {
  const { data: classesData, isLoading } = useClassesList();
  const { data: yearsData } = useAcademicYearsList()
  const classes = useMemo(() => classesData?.data || [], [classesData]);
  const years = useMemo(() => yearsData?.data.data || [], [classesData]);
  const [yearId, setYearId] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleYearId = (id: string) => {
    setYearId(id)
  }
  
  console.log(yearId)
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

      {/* Selct Academic Year */}
      
        <select 
          id={yearId}
          onChange={(e) => setYearId(e.target.id)}
          className=" px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          <option value="All">All Years</option>
          {years.map((yr: any) => (
            <option key={yr.id} value={yr.label} id={yr.id}>
              {yr.label}
            </option>
          ))}
        </select>
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
                  <h3 className="text-lg font-bold text-gray-900">{classItem.level}</h3>
                  <p className="text-sm text-gray-600">Grade: {classItem.order}</p>
                </div>

                {/* Class Details */}
                <div className="space-y-2 py-4 border-y border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Department:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {classItem.department || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Students:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {classItem._count.enrollments || '-'}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
                    <span>{classItem._count.enrollments}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Book size={16} className="text-blue-600" />
                    <span>{classItem._count.subjects}</span>
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
