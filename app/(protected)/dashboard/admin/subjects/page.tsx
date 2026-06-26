'use client';

import { useState, useMemo } from 'react';
import {
  useSubjectsList,
  useClassesList,
} from '@/src/hooks/queries/useAdmin';
import { Card } from '@/src/components/ui/Card';
import { DataTable } from '@/src/components/ui/DataTable';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loader } from '@/src/components/ui/Loader';
import { Edit2, Trash2, Plus, UserCog, ChevronDown } from 'lucide-react';
import { useDebounce } from '@/src/hooks/useUtils';
import CreateSubjectModal from './components/CreateSubjectModal';
import AssignSubjectTeacherModal from './components/AssignSubjectTeacherModal';
import { Subject } from '@/src/types';

export default function SubjectsPage() {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState(''); // empty string = "All Classes"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  // listAllSubjects has no server-side search or classId filtering — it
  // returns every subject in the school. We filter both search and class
  // client-side over that full list.
  const { data: subjectsData, isLoading } = useSubjectsList();
  const allSubjects = useMemo(() => subjectsData?.data.data || [], [subjectsData]);

  // Reuse the classes list (already fetched on the Classes page) to
  // populate the filter dropdown with real class levels + ids.
  const { data: classesData } = useClassesList();
  const classes = useMemo(() => classesData?.data.data || [], [classesData]);

  const subjects = useMemo(() => {
    return allSubjects.filter((subject: Subject) => {
      const matchesClass = !classFilter || subject.class?.id === classFilter;
      const matchesSearch =
        !debouncedSearch ||
        subject.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        subject.code?.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [allSubjects, classFilter, debouncedSearch]);

  // The subject currently being assigned a teacher. We keep name + class level
  // (not just the id) because assignSubject resolves by (subjectName, level),
  // not by subjectId.
  const [subjectToAssign, setSubjectToAssign] = useState<{
    name: string;
    classLevel: string;
  } | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */} 
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subject Management</h1>
          <p className="text-gray-600 mt-1">Create and manage school subjects</p>
        </div>
        <Button
          variant="primary"
          className="flex items-center gap-2"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={18} />
          Create Subject
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search subjects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative sm:w-56">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full appearance-none px-3 py-2 pr-9 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.level}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
      </Card>

      {/* Subjects Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader />
          </div>
        ) : (
          <DataTable<Subject>
            data={subjects}
            columns={[
          {
            key: 'name',
            label: 'Subject Name',
            render: (_, row) => (
              <div>
                <p className="font-medium">{row.name}</p>
                {row.code && <p className="text-sm text-gray-500">{row.code}</p>}
              </div>
            ),
          },
          {
            key: 'code',
            label: 'Code',
            render: (_, row) => (
              <span className="text-sm">{row.code ?? '-'}</span>
            ),
          },
          {
            key: 'class',
            label: 'Class',
            render: (_, row) => (
              <span className="text-sm">{row.class?.level ?? '-'}</span>
            ),
          },
          {
            key: 'teacher',
            label: 'Teacher',
            render: (_, row: any) => (
              row.subjectTeachers?.[0]?.teacher ? (
                <span className="text-sm font-medium text-gray-900">
                  {row.subjectTeachers[0].teacher.firstName}{' '}
                  {row.subjectTeachers[0].teacher.lastName}
                </span>
              ) : (
                <span className="text-xs uppercase tracking-wide text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  Unassigned
                </span>
              )
            ),
          },
        ]}
          rowActions={(row) => (
            <div className="flex items-center gap-2">
              <button
                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                title="Assign teacher"
                onClick={() =>
                  setSubjectToAssign({
                    name: row.name,
                    classLevel: row.class?.level ?? '',
                  })
                }
              >
                <UserCog size={18} className="text-blue-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Edit2 size={18} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={18} className="text-red-600" />
              </button>
            </div>
          )}
          isEmpty={subjects.length === 0}
          emptyMessage={
            classFilter || search
              ? 'No subjects match your filters'
              : 'No subjects found'
          }
        />
        )}
      </Card>

      {/* Create Subject Modal */}
      {isCreateModalOpen && (
        <CreateSubjectModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* Assign Subject Teacher Modal */}
      {subjectToAssign && (
        <AssignSubjectTeacherModal
          subjectName={subjectToAssign.name}
          classLevel={subjectToAssign.classLevel}
          onClose={() => setSubjectToAssign(null)}
          onSuccess={() => setSubjectToAssign(null)}
        />
      )}
    </div>
  );
}
