'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Loader } from '@/src/components/ui/Loader';
import { Button } from '@/src/components/ui/Button';
import {
  CheckCircle2,
  Clock,
  FileText,
  Users,
  Trophy,
} from 'lucide-react';
import { useReportCardList } from '@/src/hooks/queries/useReportCard';
import { CompiledCardSummary, PendingStudent } from '@/src/types';
import { ReportCardDownloadButton } from '@/src/components/reportCards/ReportCardDownloadButton';

// ─── status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'DRAFT' | 'PUBLISHED' }) {
  return status === 'PUBLISHED' ? (
    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase
                     tracking-wide bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={11} /> Published
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase
                     tracking-wide bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
      <Clock size={11} /> Draft
    </span>
  );
}

// ─── compiled card row ────────────────────────────────────────────────────────

interface CompiledRowProps {
  card: CompiledCardSummary;
  classId: string;
}

function CompiledRow({ card, classId }: CompiledRowProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          <button onClick={() => router.push(`/dashboard/teacher/classes/${classId}/report-cards/compile/${card.studentId}`)} className="text-left hover:text-blue-700 hover:underline">
            {card.lastName}, {card.firstName}
          </button>
        </p>
        <p className="text-xs text-gray-400">{card.studentNumber}</p>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="font-bold text-gray-900">{card.totalScore ?? '—'}</p>
          <p className="text-[10px] text-gray-400">Total</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900">{card.average ?? '—'}</p>
          <p className="text-[10px] text-gray-400">Average</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900 flex items-center gap-1">
            {card.position ? (
              <>
                <Trophy size={12} className="text-amber-500" />
                {card.position}
              </>
            ) : '—'}
          </p>
          <p className="text-[10px] text-gray-400">Position</p>
        </div>
      </div>

      {/* Status + remark indicator */}
      <div className="flex items-center gap-2">
        <StatusBadge status={card.status} />
        {!card.hasTeacherRemark && (
          <span className="text-[10px] text-red-500 font-medium">No remark</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <ReportCardDownloadButton reportCardId={card.reportCardId} compact />
        <Button
          variant="outline"
          size="sm"
          disabled={card.status === "PUBLISHED"}
          onClick={() =>
            router.push(
              `/dashboard/teacher/classes/${classId}/report-cards/edit/${card.reportCardId}`,
            )
          }
        >
          <FileText size={14} /> Edit
        </Button>
      </div>
    </div>
  );
}

// ─── pending student row ──────────────────────────────────────────────────────

interface PendingRowProps {
  student: PendingStudent;
  classId: string;
}

function PendingRow({ student, classId }: PendingRowProps) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-700 truncate">
          <button onClick={() => router.push(`/dashboard/teacher/classes/${classId}/report-cards/compile/${student.studentId}`)} className="text-left hover:text-blue-700 hover:underline">
            {student.lastName}, {student.firstName}
          </button>
        </p>
        <p className="text-xs text-gray-400">{student.studentNumber}</p>
      </div>
      <span className="text-xs text-gray-400 italic">Not compiled</span>
      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/teacher/classes/${classId}/report-cards/compile/${student.studentId}`)}>
        View report sheet
      </Button>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function CompileReportCardsPage() {
  const { classId } = useParams<{ classId: string }>();
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');
  const { data, isLoading, error } = useReportCardList(classId, selectedYearId || undefined, selectedTermId || undefined);

  const compiled = data?.data.compiled ?? [];
  const pending = data?.data.pending ?? [];
  const meta = data?.data.meta;
  console.log("compiled:", compiled, "pending:", pending, "meta:", meta)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-red-600 font-medium">Could not load report cards.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compile Report Cards</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {meta ? `${meta.termLabel} · ${meta.academicYearLabel}` : 'Choose an academic year and term'} · click "Compile" to generate a student's card from their scores
        </p>
      </div>

      {meta && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              Academic Year
              <select
                value={selectedYearId || meta.academicYearId}
                onChange={(event) => { setSelectedYearId(event.target.value); setSelectedTermId(''); }}
                className="min-w-44 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
              >
                {meta.availableAcademicYears.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              Term
              <select
                value={selectedTermId || meta.termId}
                onChange={(event) => setSelectedTermId(event.target.value)}
                className="min-w-44 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
              >
                {meta.availableTerms.map((term) => <option key={term.id} value={term.id}>{term.period}</option>)}
              </select>
            </label>
          </div>
        </Card>
      )}

      {/* Progress summary */}
      {meta && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Students', value: meta.classCount, icon: <Users size={16} /> },
            { label: 'Compiled', value: meta.compiledCount, icon: <FileText size={16} /> },
            { label: 'Published by admin', value: meta.publishedCount, icon: <CheckCircle2 size={16} /> },
            {
              label: 'Pending',
              value: meta.classCount - meta.compiledCount,
              icon: <Clock size={16} />,
            },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3
                         flex items-center gap-3"
            >
              <span className="text-gray-400">{icon}</span>
              <div>
                <p className="text-lg font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compiled cards */}
      {compiled.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Compiled ({compiled.length})
          </h2>
          <Card className="p-0! overflow-hidden">
            <div className="divide-y divide-gray-100">
              {compiled.map((card) => (
                <CompiledRow
                  key={card.reportCardId}
                  card={card}
                  classId={classId}
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Pending students */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Not Yet Compiled ({pending.length})
          </h2>
          <Card className="p-0! overflow-hidden">
            <div className="divide-y divide-gray-100">
              {pending.map((student) => (
                <PendingRow
                  key={student.studentId}
                  student={student}
                  classId={classId}
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      {compiled.length === 0 && pending.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">No students enrolled in this class yet.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
