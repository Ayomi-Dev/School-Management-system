'use client';

import { useState } from 'react';
import { useMyClassStudents } from '@/src/hooks/queries/useTeacher';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/src/components/ui/Card';
import { Loader } from '@/src/components/ui/Loader';
import {
  Search,
  Users,
} from 'lucide-react';
import { Student, StudentCard } from '../../../../components/studentList';



// ─── page ────────────────────────────────────────────────────────────────────

export default function StudentListPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: studentsData, isLoading, error } = useMyClassStudents(classId);

  const classInfo = studentsData?.data.class;
  const students: Student[] = studentsData?.data.students ?? [];
  const studentCount = studentsData?.data.studentCount ?? 0;
  const academicYear = studentsData?.data.academicYear;

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.studentNumber.toLowerCase().includes(q)
    );
  });

  // ── navigation handlers ──────────────────────────────────────────────────
  // Score entry routes to My Subjects first — a subject must be chosen
  // before scores can be entered. The student's id is passed as a query
  // param so the subject picker can deep-link directly into that student's
  // row on the score entry grid.
  const handleScores = (studentId: string) => {
    router.push(
      `/dashboard/teacher/classes/${classId}/subjects?studentId=${studentId}`,
    );
  };

  // Attendance routes to today's mark page — the teacher is dropped straight
  // into the daily roster where they can see and update the student's status.
  const handleAttendance = (studentId: string) => {
    router.push(
      `/dashboard/teacher/classes/${classId}/attendance/mark?highlight=${studentId}`,
    );
  };

  const handleAssignments = (studentId: string) => {
    router.push(
      `/dashboard/teacher/classes/${classId}/assignments?studentId=${studentId}`,
    );
  };

  const handleViewProfile = (studentId: string) => {
    router.push(
      `/dashboard/teacher/classes/${classId}/students/profiles/${studentId}`,
    );
  };

  // ── render ───────────────────────────────────────────────────────────────

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
          <p className="text-red-600 font-medium">Could not load class students.</p>
          <p className="text-sm text-gray-500 mt-1">
            {(error as any)?.response?.data?.error ?? 'Please try again.'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {classInfo?.level ?? 'Class'} — Students
          </h1>
          <p className="text-gray-500 mt-1 text-sm flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              {studentCount} student{studentCount !== 1 ? 's' : ''}
            </span>
            {academicYear && (
              <>
                <span className="text-gray-300">·</span>
                <span>{academicYear.label}</span>
              </>
            )}
            {classInfo?.department && (
              <>
                <span className="text-gray-300">·</span>
                <span>{classInfo.department}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search by name or student number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm
                     placeholder:text-gray-400 focus:outline-none focus:ring-2
                     focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-gray-600">
              {search ? `No students match "${search}"` : 'No students enrolled in this class yet.'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Filtered count hint */}
          {search && (
            <p className="text-sm text-gray-500">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                classId={classId}
                onViewProfile={handleViewProfile}
                onScores={handleScores}
                onAttendance={handleAttendance}
                onAssignments={handleAssignments}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
