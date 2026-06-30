'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useClassDetail,
  useClassScoreSheet,
  usePublishClassReportCardsMutation,
} from '@/src/hooks/queries/useAdmin';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';
import { Input } from '@/src/components/ui/Input';
import {
  ArrowLeft,
  Users,
  BookOpen,
  FileSpreadsheet,
  Send,
  AlertCircle,
  UserCog,
  ChevronRight,
  Search,
  Download,
} from 'lucide-react';
import type { ClassDetail, ScoreSheet } from '@/src/types/admin';

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'students' | 'subjects' | 'scoresheet';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('students');
  const [studentSearch, setStudentSearch] = useState('');
  const [scoresheetEnabled, setScoresheetEnabled] = useState(false);

  const { data: classDetail, isLoading, isError } = useClassDetail(classId);

  const {
    data: scoreSheet,
    isLoading: scoreSheetLoading,
    refetch: refetchScoreSheet,
  } = useClassScoreSheet(classId, scoresheetEnabled);
  console.log(scoreSheet)

  const publishMutation = usePublishClassReportCardsMutation(classId);

  const handleFetchScoresheet = () => {
    setActiveTab('scoresheet');
    if (scoresheetEnabled) {
      refetchScoreSheet();
    } else {
      setScoresheetEnabled(true);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader /></div>;
  }

  if (isError || !classDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-gray-600">Could not load class details.</p>
        <Button variant="outline" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const filteredStudents = classDetail.enrollments.filter((e) => {
    const fullName = `${e.student.user.firstName} ${e.student.user.lastName}`.toLowerCase();
    return fullName.includes(studentSearch.toLowerCase());
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'students', label: 'Students', icon: <Users size={15} />, count: classDetail._count.enrollments },
    { id: 'subjects', label: 'Subjects', icon: <BookOpen size={15} />, count: classDetail._count.subjects },
    { id: 'scoresheet', label: 'Score Sheet', icon: <FileSpreadsheet size={15} /> },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Classes
      </button>

      {/* Class Header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {classDetail.level.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{classDetail.level}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-0.5">
                {classDetail.department && <span>Dept: {classDetail.department}</span>}
                <span>{classDetail._count.enrollments} students</span>
                <span>{classDetail._count.subjects} subjects</span>
              </div>
            </div>
          </div>

          {classDetail.teacherAssignment ? (
            <button
              onClick={() => router.push(`/admin/users/${classDetail.teacherAssignment!.teacher.user.id}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors shrink-0"
            >
              <div className="w-7 h-7 rounded-full bg-linear-to-br from-purple-400 to-purple-600 text-white text-xs font-bold flex items-center justify-center">
                {classDetail.teacherAssignment.teacher.user.firstName[0]}
                {classDetail.teacherAssignment.teacher.user.lastName[0]}
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wide text-purple-500">Class Teacher</p>
                <p className="text-sm font-medium text-purple-900">
                  {classDetail.teacherAssignment.teacher.user.firstName}{' '}
                  {classDetail.teacherAssignment.teacher.user.lastName}
                </p>
              </div>
              <ChevronRight size={14} className="text-purple-400" />
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm shrink-0">
              <UserCog size={14} />
              No teacher assigned
            </span>
          )}
        </div>
      </Card>

      {/* Class-level actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="flex items-center gap-2" onClick={handleFetchScoresheet}>
          <FileSpreadsheet size={16} />
          Fetch Score Sheet
        </Button>
        <Button
          variant="primary"
          className="flex items-center gap-2"
          onClick={() => publishMutation.mutate()}
          disabled={publishMutation.isPending}
        >
          <Send size={16} />
          {publishMutation.isPending ? 'Publishing...' : 'Publish All Report Cards'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'scoresheet') setScoresheetEnabled(true);
              }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab panels */}
      {activeTab === 'students' && (
        <StudentsTab
          enrollments={filteredStudents}
          search={studentSearch}
          onSearchChange={setStudentSearch}
          onStudentClick={(userId) => router.push(`/dashboard/admin/users/${userId}`)}
        />
      )}
      {activeTab === 'subjects' && <SubjectsTab subjects={classDetail.subjects} />}
      {activeTab === 'scoresheet' && (
        <ScoreSheetTab
          scoreSheet={scoreSheet}
          isLoading={scoreSheetLoading}
          onRefetch={() => refetchScoreSheet()}
        />
      )}
    </div>
  );
}

// ─── Students Tab ─────────────────────────────────────────────────────────────

function StudentsTab({
  enrollments,
  search,
  onSearchChange,
  onStudentClick,
}: {
  enrollments: ClassDetail['enrollments'];
  search: string;
  onSearchChange: (v: string) => void;
  onStudentClick: (userId: string) => void;
}) {
  const statusColor: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-600',
    PENDING: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-gray-500">
          {enrollments.length} student{enrollments.length !== 1 ? 's' : ''}
        </p>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <p className="text-center py-12 text-gray-500">
            {search ? 'No students match your search.' : 'No students enrolled in this class.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {enrollments.map((enrollment) => {
            const u = enrollment.student.user;
            const initials = `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
            return (
              <button
                key={enrollment.id}
                onClick={() => onStudentClick(u.id)}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                    {u.firstName} {u.lastName}
                  </p>
                  {enrollment.student.studentNumber && (
                    <p className="text-xs text-gray-500 truncate">{enrollment.student.studentNumber}</p>
                  )}
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[u.status] ?? statusColor.INACTIVE}`}>
                    {u.status}
                  </span>
                </div>
                <ChevronRight size={15} className="text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Subjects Tab ─────────────────────────────────────────────────────────────

function SubjectsTab({ subjects }: { subjects: ClassDetail['subjects'] }) {
  return (
    <div>
      {subjects.length === 0 ? (
        <Card>
          <p className="text-center py-12 text-gray-500">No subjects assigned to this class.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((subject, i) => (
            <div key={subject.id} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{subject.name}</p>
                {subject.code && <p className="text-xs text-gray-500">{subject.code}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Score Sheet Tab ──────────────────────────────────────────────────────────

function ScoreSheetTab({
  scoreSheet,
  isLoading,
  onRefetch,
}: {
  scoreSheet?: ScoreSheet;
  isLoading: boolean;
  onRefetch: () => void;
}) {
  if (isLoading) {
    return <div className="flex items-center justify-center h-60"><Loader /></div>;
  }

  if (!scoreSheet) {
    return (
      <Card>
        <div className="text-center py-12 space-y-3">
          <FileSpreadsheet size={32} className="text-gray-300 mx-auto" />
          <p className="text-gray-500">Score sheet not yet fetched.</p>
          <Button variant="outline" onClick={onRefetch}>Load Score Sheet</Button>
        </div>
      </Card>
    );
  }

  const gradeColors: Record<string, string> = {
    A1: 'text-emerald-700 font-bold',
    B2: 'text-green-700',
    B3: 'text-lime-700',
    C4: 'text-yellow-700',
    C5: 'text-amber-700',
    C6: 'text-orange-700',
    D7: 'text-red-600',
    E8: 'text-red-700',
    F9: 'text-red-800 font-bold',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {scoreSheet.term} — {scoreSheet.year} · {scoreSheet.rows.length} students
        </p>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Download size={14} />
          Export
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm min-w-175">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50">
                Student
              </th>
              {scoreSheet.subjects.map((subj) => (
                <th
                  key={subj}
                  className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-2 border-r"
                  colSpan={4}
                >
                  {subj}
                </th>
              ))}
            </tr>
            <tr className="bg-gray-50 text-[10px] text-gray-400 uppercase">
              <th className="px-4 py-2 text-left sticky left-0 bg-gray-50" />
              {scoreSheet.subjects.map((subj) => (
                <>
                  <th key={`${subj}-ca`} className="px-3 py-2 text-center border-2 border-r-2">CA</th>
                  <th key={`${subj}-ex`} className="px-3 py-2 text-center border-2 border-r-2">Exam</th>
                  <th key={`${subj}-tot`} className="px-3 py-2 text-center border-2 border-r-2">Total</th>
                  <th key={`${subj}-gr`} className="px-3 py-2 text-center border-2 border-r-2">Grd</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {scoreSheet.rows.map((row) => (
              <tr key={row.studentId} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white whitespace-nowrap">
                  <div>
                    <p>{row.studentName}</p>
                    {row.studentNumber && (
                      <p className="text-[10px] text-gray-400">{row.studentNumber}</p>
                    )}
                  </div>
                </td>
                {scoreSheet.subjects.map((subj) => {
                  const s = row.scores[subj];
                  return s ? (
                    <>
                      <td key={`${row.studentId}-${subj}-ca`} className="px-3 py-3 text-center text-gray-600">{s.ca}</td>
                      <td key={`${row.studentId}-${subj}-ex`} className="px-3 py-3 text-center text-gray-600">{s.exam}</td>
                      <td key={`${row.studentId}-${subj}-tot`} className="px-3 py-3 text-center text-gray-600">{s.total}</td>
                      <td key={`${row.studentId}-${subj}-gr`} className="px-3 py-3 text-center">
                        <span className={gradeColors[s.grade] ?? ''}>{s.grade}</span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td key={`${row.studentId}-${subj}-ca`} className="px-3 py-3 text-center text-gray-300">—</td>
                      <td key={`${row.studentId}-${subj}-ex`} className="px-3 py-3 text-center text-gray-300">—</td>
                      <td key={`${row.studentId}-${subj}-tot`} className="px-3 py-3 text-center text-gray-300">—</td>
                      <td key={`${row.studentId}-${subj}-gr`} className="px-3 py-3 text-center text-gray-300">—</td>
                    </>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}