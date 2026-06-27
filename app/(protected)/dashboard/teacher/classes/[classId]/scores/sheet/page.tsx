'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader } from '@/src/components/ui/Loader';
import { Card } from '@/src/components/ui/Card';
import { Search, ArrowUpDown, FileSpreadsheet } from 'lucide-react';
import {useScoreSheet} from '@/src/hooks/queries/useScores';
import { ScoreSheetCell, ScoreSheetStudent, ScoreSheetSubject } from '@/app/(protected)/dashboard/teacher/components/teacher';


function ScoreCell({ cell }: { cell: ScoreSheetCell | null }) {
  if (!cell || (cell.caScore === null && cell.examScore === null)) {
    return (
      <div className="text-center">
        <span className="text-gray-300 text-xs">—</span>
      </div>
    );
  }

  const gradeColor =
    cell.grade === 'A'
      ? 'text-emerald-700'
      : cell.grade === 'B'
      ? 'text-blue-700'
      : cell.grade === 'C'
      ? 'text-amber-700'
      : cell.grade === 'D'
      ? 'text-orange-600'
      : cell.grade === 'F'
      ? 'text-red-600'
      : 'text-gray-700';

  return (
    <div className="text-center space-y-0.5">
      {/* CA / Exam breakdown */}
      <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
        <span>{cell.caScore ?? '—'}</span>
        <span className="text-gray-200">+</span>
        <span>{cell.examScore ?? '—'}</span>
      </div>
      {/* Total + grade */}
      {cell.totalScore !== null ? (
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm font-bold text-gray-900">{cell.totalScore}</span>
          {cell.grade && (
            <span className={`text-xs font-bold ${gradeColor}`}>{cell.grade}</span>
          )}
        </div>
      ) : (
        <span className="text-xs text-gray-400">incomplete</span>
      )}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

type SortKey = 'name' | string; // string = subjectId to sort by totalScore

export default function ScoreSheetPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const { data, isLoading, error } = useScoreSheet(classId);

  const subjects: ScoreSheetSubject[] = data?.data.subjects ?? [];
  const rawStudents: ScoreSheetStudent[] = data?.data.students ?? [];
  const termPeriod = data?.data.meta.term

  // Filter by name / student number
  const filtered = rawStudents.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.studentNumber.toLowerCase().includes(q)
    );
  });

  // Sort — either alphabetically by name, or by totalScore for a subject
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'name') {
      const nameA = `${a.lastName} ${a.firstName}`;
      const nameB = `${b.lastName} ${b.firstName}`;
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    }
    const scoreA = a.scores[sortKey]?.totalScore ?? -1;
    const scoreB = b.scores[sortKey]?.totalScore ?? -1;
    return sortAsc ? scoreA - scoreB : scoreB - scoreA;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(false); // default desc when switching to a score column
    }
  };

  const goToSubject = (subjectId: string) => {
    router.push(
      `/dashboard/teacher/classes/${classId}/subjects/${subjectId}/scores`,
    );
  };

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
          <p className="text-red-600 font-medium">Could not load score sheet.</p>
          <p className="text-sm text-gray-500 mt-1">
            {(error as any)?.response?.data?.error ?? 'Please try again.'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Score Sheet</h1>
          <p className="text-sm text-gray-500 mt-1">
            Current term: <span className='text-green-500'>{termPeriod}</span> · {rawStudents.length} students · {subjects.length} subjects
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <FileSpreadsheet size={18} />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm
                     placeholder:text-gray-400 focus:outline-none focus:ring-2
                     focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-gray-400">
        <span>Cell format:</span>
        <span className="font-mono">CA + Exam</span>
        <span className="text-gray-200">|</span>
        <span className="font-bold text-gray-600">Total Grade</span>
        <span className="text-gray-200">|</span>
        <span>Click a subject header to sort · Click to enter scores</span>
      </div>

      {/* Table — horizontally scrollable on small screens */}
      {sorted.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">
              {search ? `No students match "${search}"` : 'No students enrolled yet.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {/* Sticky student column header */}
                <th
                  className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left
                             font-semibold text-gray-600 border-r border-gray-200
                             min-w-45 cursor-pointer select-none"
                  onClick={() => handleSort('name')}
                >
                  <span className="flex items-center gap-1.5">
                    Student
                    <ArrowUpDown size={13} className="text-gray-400" />
                  </span>
                </th>

                {/* Subject column headers — clickable to sort by that subject's total */}
                {subjects.map((subject) => (
                  <th
                    key={subject.id}
                    className="px-4 py-3 text-center font-semibold text-gray-600
                               min-w-20 cursor-pointer select-none hover:bg-gray-100
                               transition-colors"
                    onClick={() => handleSort(subject.id)}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="truncate max-w-25" title={subject.name}>
                        {subject.name}
                      </span>
                      {subject.code && (
                        <span className="text-[10px] text-gray-400 font-normal">
                          {subject.code}
                        </span>
                      )}
                      {sortKey === subject.id && (
                        <ArrowUpDown size={11} className="text-emerald-600" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>

              {/* Sub-header: CA / Exam / Total labels per subject */}
              <tr className="border-b border-gray-100 bg-white">
                <th className="sticky left-0 bg-white z-10 border-r border-gray-200 px-4 py-1.5">
                  <button
                    onClick={() => handleSort('name')}
                    className="text-[10px] text-gray-400 font-normal flex items-center gap-1"
                  >
                    Sort by name
                  </button>
                </th>
                {subjects.map((subject) => (
                  <th key={subject.id} className="px-2 py-1.5">
                    <button
                      onClick={() => goToSubject(subject.id)}
                      className="text-[10px] text-emerald-600 hover:text-emerald-700
                                 font-medium transition-colors"
                    >
                      Enter scores →
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {sorted.map((student, idx) => (
                <tr
                  key={student.studentId}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                >
                  {/* Sticky student name cell */}
                  <td
                    className="sticky left-0 z-10 px-4 py-3 border-r border-gray-100
                               font-medium text-gray-900 bg-inherit"
                  >
                    <p className="truncate max-w-40">
                      {student.lastName}, {student.firstName}
                    </p>
                    <p className="text-[10px] text-gray-400">{student.studentNumber}</p>
                  </td>

                  {/* Score cells */}
                  {subjects.map((subject) => (
                    <td key={subject.id} className="px-3 py-3">
                      <ScoreCell cell={student.scores[subject.id]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
