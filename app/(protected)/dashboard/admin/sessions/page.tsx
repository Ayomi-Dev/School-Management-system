'use client';

import { useState, useMemo } from 'react';
import { useAcademicYearsList } from '@/src/hooks/queries/useAcademic';
import { Card } from '@/src/components/ui/Card';
import { DataTable } from '@/src/components/ui/DataTable';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';
import { Edit2, Trash2, Plus, CheckCircle, X } from 'lucide-react';
import CreateAcademicYearModal from './components/CreateAcademicYearModal';
import CreateTermModal from './components/CreateTermModal';

export default function SessionsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateTermModalOpen, setIsCreateTermModalOpen] = useState(false);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string | null>(null);
  const { data: yearsData, isLoading } = useAcademicYearsList();

  const years = useMemo(() => yearsData || [], [yearsData]);
  console.log(years)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Academic Sessions</h1>
          <p className="text-gray-600 mt-1">Manage academic years and terms</p>
        </div>
        <Button
          variant="primary"
          className="flex items-center gap-2"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={18} />
          New Academic Year
        </Button>
      </div>

      {/* Academic Years */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader />
        </div>
      ) : years.length > 0 ? (
        <div className="space-y-4">
          {years.map((year: any) => (
            <Card key={year.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{year.label}</h3>
                    {year.isCurrent ? (
                      <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        <CheckCircle size={14} />
                        Active
                      </span>
                    ) 
                    : (
                      <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        <X size={14} />
                        Session Inaactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDate(year.startDate)} - {formatDate(year.endDate)}
                  </p>

                  {/* Terms */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-3">Terms</p>
                    <div className="space-y-2">
                      {year.terms.map((term: any) => (
                        <div key={term.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                          <div>
                            <p className="text-sm text-black font-bold">{term.period}</p>
                            <p className="text-xs text-gray-500">{formatDate(term.startDate)} - {formatDate(term.endDate)}</p>
                          </div>
                          <button className="text-gray-400 hover:text-gray-600">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => {
                      setSelectedAcademicYearId(year.id);
                      setIsCreateTermModalOpen(true);
                    }}>
                      Add Term
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit2 size={18} className="text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">No academic years created yet</p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create First Academic Year
            </Button>
          </div>
        </Card>
      )}

      {/* Modal */}
      {isCreateModalOpen && (
        <CreateAcademicYearModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => setIsCreateModalOpen(false)}
        />
      )}
      {isCreateTermModalOpen && (
        <CreateTermModal
          academicYearId={selectedAcademicYearId ?? ''}
          onClose={() => setIsCreateTermModalOpen(false)}
          onSuccess={() => setIsCreateTermModalOpen(false)}
        />
      )}
    </div>
  );
}
