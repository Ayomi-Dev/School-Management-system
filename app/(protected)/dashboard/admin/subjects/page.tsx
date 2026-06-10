'use client';

import { useState, useMemo } from 'react';
import { useSubjectsList, useCreateSubjectMutation } from '@/src/hooks/queries/useAdmin';
import { Card } from '@/src/components/ui/Card';
import { DataTable } from '@/src/components/ui/DataTable';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loader } from '@/src/components/ui/Loader';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { useDebounce } from '@/src/hooks/useUtils';
import CreateSubjectModal from './components/CreateSubjectModal';
import { Subject } from '@/src/types';

export default function SubjectsPage() {
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data: subjectsData, isLoading } = useSubjectsList({
    search: debouncedSearch,
  });
  const subjects = useMemo(() => subjectsData?.data.data || [], [subjectsData]); //fectches the subjects data

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
        <Input
          placeholder="Search subjects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
                render: (value, row: any) => (
                  <div>
                    <p className="font-medium">{value as string}</p>
                    {row.code && <p className="text-sm text-gray-500">{row.code}</p>}
                  </div>
                ),
              },
              {
                key: 'code',
                label: 'Code',
                render: (value) => <span className="text-sm">{value as string}</span>,
              },
              {
                key: 'class',
                label: 'Class',
                render: (_, row) => (
                  <span className="text-sm">{row.class?.level ?? '-'}</span>
                ),
              },
            ]}
            rowActions={() => (
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit2 size={18} className="text-gray-600" />
                </button>
                <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </div>
            )}
            isEmpty={subjects.length === 0}
            emptyMessage="No subjects found"
          />
        )}
      </Card>

      {/* Modal */}
      {isCreateModalOpen && (
        <CreateSubjectModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}
