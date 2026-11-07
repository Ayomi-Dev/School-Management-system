'use client';

import { useState, useMemo } from 'react';
import { useClassesList } from '@/src/hooks/queries/useClasses';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';
import { Edit2, Trash2, Plus, Users, Book, UserCog, UserX, ChevronRight } from 'lucide-react';
import CreateClassModal from './components/CreateClassModal';
import AssignClassTeacherModal from './components/AssignClassTeacherModal';
import { useRouter } from 'next/navigation';
import { useUnassignClassTeacherMutation } from '@/src/hooks/queries/useClasses';

export default function ClassesPage() {
  const { data: classesData, isLoading } = useClassesList();
  const classes = useMemo(() => classesData || [], [classesData]);
  console.log("classesData:", classesData)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  const [classToAssign, setClassToAssign] = useState<{
    id: string;
    level: string;
  } | null>(null);
  const { mutate: unassignTeacher, isPending: isUnassigning } = useUnassignClassTeacherMutation();

  const handleCardClick = (classId: string) => {
    router.push(`/dashboard/admin/classes/${classId}`);
  };

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

      {/* Classes Grid */}
      {isLoading ? ( 
        <div className="flex items-center justify-center h-96">
          <Loader />
        </div>
      ) : classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((classItem: any) => {
            const classTeacherAssignment = classItem.teacherAssignments?.find(
              (assignment: any) => assignment.isClassTeacher,
            ) ?? classItem.teacherAssignments?.[0];

            return (
              <Card
                key={classItem.id}
                className="hover:shadow-lg transition-all cursor-pointer group border border-transparent hover:border-blue-200"
              >
              <div className="space-y-4" onClick={() => handleCardClick(classItem.id)}>
                {/* Class Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {classItem.level}
                    </h3>
                    <p className="text-sm text-gray-600">Grade: {classItem.order}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {classTeacherAssignment ? (
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">
                          {classTeacherAssignment.isClassTeacher ? 'Class Teacher' : 'Assigned Teacher'}
                        </p>
                        <span className='text-sm'>{classTeacherAssignment.teacher.firstName} {classTeacherAssignment.teacher.lastName}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wide text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        Unassigned
                      </span>
                    )}
                    <ChevronRight
                      size={16}
                      className="text-gray-300 group-hover:text-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Class Details */}
                <div className="space-y-2 py-4 border-y border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Subjects:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {classItem._count.subjects || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Students:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {classItem._count.enrollments || '0'}
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

                {/* Actions — stop propagation so clicks here don't navigate */}
                <div
                  className="flex flex-col gap-2 pt-4 border-t border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full flex items-center justify-center gap-2 ${classTeacherAssignment ? 'text-red-600' : ''}`}
                    disabled={isUnassigning}
                    onClick={() => {
                      if (!classTeacherAssignment) {
                        setClassToAssign({ id: classItem.id, level: classItem.level });
                        return;
                      }

                      const teacherName = `${classTeacherAssignment.teacher.firstName} ${classTeacherAssignment.teacher.lastName}`;
                      if (window.confirm(`Unassign ${teacherName} from ${classItem.level}? You can then assign them to another class.`)) {
                        unassignTeacher(classTeacherAssignment.teacherId);
                      }
                    }}
                  >
                    {classTeacherAssignment ? <UserX size={16} /> : <UserCog size={16} />}
                    {classTeacherAssignment
                      ? isUnassigning ? 'Unassigning...' : 'Unassign Teacher'
                      : 'Assign Teacher'}
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-red-600 flex items-center justify-center gap-1">
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </div>
              </div>
              </Card>
            );
          })}
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

      {/* Create Class Modal */}
      {isCreateModalOpen && (
        <CreateClassModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* Assign Class Teacher Modal */}
      {classToAssign && (
        <AssignClassTeacherModal
          classLevel={classToAssign.level}
          onClose={() => setClassToAssign(null)}
          onSuccess={() => setClassToAssign(null)}
        />
      )}
    </div>
  );
}
