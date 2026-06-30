'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/src/components/ui/Card';
import { Loader } from '@/src/components/ui/Loader';
import { Button } from '@/src/components/ui/Button';
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  FileText,
  Users,
  Trophy,
} from 'lucide-react';
import {
  useReportCardList,
  useCompileReportCard,
} from '@/src/hooks/queries/useReportCard';
import { CompiledCardSummary, PendingStudent } from '@/src/types';

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
  onRecompile: (studentId: string) => void;
  isRecompiling: boolean;
}

function CompiledRow({ card, classId, onRecompile, isRecompiling }: CompiledRowProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {card.lastName}, {card.firstName}
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
        <button
          onClick={() => onRecompile(card.studentId)}
          disabled={isRecompiling || card.status === "PUBLISHED"}
          title="Recompile (recalculate scores and position)"
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors
                     text-gray-400 hover:text-gray-700 disabled:opacity-40"
        >
          <RefreshCw size={15} className={isRecompiling ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}

// ─── pending student row ──────────────────────────────────────────────────────

interface PendingRowProps {
  student: PendingStudent;
  onCompile: (studentId: string) => void;
  isCompiling: boolean;
}

function PendingRow({ student, onCompile, isCompiling }: PendingRowProps) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-700 truncate">
          {student.lastName}, {student.firstName}
        </p>
        <p className="text-xs text-gray-400">{student.studentNumber}</p>
      </div>
      <span className="text-xs text-gray-400 italic">Not compiled</span>
      <Button
        variant="primary"
        size="sm"
        onClick={() => onCompile(student.studentId)}
        disabled={isCompiling}
      >
        {isCompiling ? 'Compiling...' : 'Compile'}
      </Button>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function CompileReportCardsPage() {
  const { classId } = useParams<{ classId: string }>();
  const { data, isLoading, error } = useReportCardList(classId);

  const { mutate: compile, isPending: isCompiling, variables: compilingId } =
    useCompileReportCard(classId);

  const compiled = data?.data.compiled ?? [];
  const pending = data?.data.pending ?? [];
  const meta = data?.data.meta;

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
          Current term · click "Compile" to generate a student's card from their scores
        </p>
      </div>

      {/* Progress summary */}
      {meta && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Students', value: meta.classCount, icon: <Users size={16} /> },
            { label: 'Compiled', value: meta.compiledCount, icon: <FileText size={16} /> },
            { label: 'Published', value: meta.publishedCount, icon: <CheckCircle2 size={16} /> },
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
                  onRecompile={(studentId) => compile(studentId)}
                  isRecompiling={isCompiling && compilingId === card.studentId}
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
                  onCompile={(studentId) => compile(studentId)}
                  isCompiling={isCompiling && compilingId === student.studentId}
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
