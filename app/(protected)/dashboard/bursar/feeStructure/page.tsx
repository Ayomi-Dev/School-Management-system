'use client';

import { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';
import type { FeeStructure } from '@/src/types/fees';
import {  Plus, Tag } from 'lucide-react';
import { CreateFeeStructureModal } from '../components/modals/CreateFeeStructure';
import { AssignFeeModal } from '../components/modals/AssignFeeStructure';
import { useFeeStructures } from '@/src/hooks/queries/useFees';
import { FeeCard } from '../components/feeCard';
import { useClassesList } from '@/src/hooks/queries/useClasses';
import { useAcademicYearsList } from '@/src/hooks/queries/useAcademic';
import { useCurrentTerm } from '@/src/hooks/queries/useAcademic';
import { ClassDetail } from '@/src/types/admin';
import { AcademicYear } from '@/src/types';



export default function FeeStructuresPage() {
  const {
    isLoading: termsLoading,
    isError: termsError,
    termId,
    termPeriod,
    currentTerm

  } = useCurrentTerm();

  
  const { data: structures = [], isLoading: feeStructureLoading } = useFeeStructures(termId);
  const { data: classes, isLoading: classesLoading } = useClassesList();
  const { data: academicYears, isLoading: academicYearsLoading } = useAcademicYearsList();
  
  const [createOpen, setCreateOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<FeeStructure | null>(null);
  
  const schoolWide = structures?.filter((s) => !s.classId);
  const classSpecific = structures?.filter((s) => s.classId);
  const isLoading = termsLoading || feeStructureLoading || classesLoading || academicYearsLoading;
  
  console.log(" lists", classes, academicYears, currentTerm )
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Structures</h1>
          <p className="text-sm text-gray-500 mt-0.5">{termPeriod}</p>
        </div>
        <Button
          variant="primary"
          className="flex items-center gap-2"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={16} />
          New Fee Structure
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-60"><Loader /></div>
      ) : structures?.length === 0 ? (
        <Card>
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
              <Tag size={22} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">No fee structures yet</p>
            <p className="text-sm text-gray-400">Create your first fee structure for {termPeriod}</p>
            <Button variant="primary" className="mt-2" onClick={() => setCreateOpen(true)}>
              Create Fee Structure
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* School-wide fees */}
          {schoolWide && schoolWide.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                School-wide
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {schoolWide?.map((s) => (
                  <FeeCard
                    key={s.id}
                    structure={s}
                    onAssign={() => setAssignTarget(s)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Class-specific fees */}
          {classSpecific && classSpecific.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Class-specific
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classSpecific.map((s) => (
                  <FeeCard
                    key={s.id}
                    structure={s}
                    onAssign={() => setAssignTarget(s)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {createOpen && (
        <CreateFeeStructureModal
          termId={termId}
          termPeriod={termPeriod}
          classes={classes as ClassDetail[]}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => setCreateOpen(false)}
        />
      )}
      {assignTarget && (
        <AssignFeeModal
          feeStructure={assignTarget}
          classes={classes as ClassDetail[]}
          academicYears={academicYears as AcademicYear[]}
          onClose={() => setAssignTarget(null)}
          onSuccess={() => setAssignTarget(null)}
        />
      )}
    </div>
  );
}
