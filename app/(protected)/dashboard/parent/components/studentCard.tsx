"use client";

import { useRouter } from "next/navigation";
import { attendanceColor } from "./attendanceColor";
import { LinkedStudent } from "@/src/types/parent";
import { BookOpen, ChevronRight, FileText, GraduationCap, TrendingUp } from "lucide-react";

export function StudentCard({ student, index }: { student: LinkedStudent; index: number }) {
  const router  = useRouter();
  const colors  = attendanceColor(student.snapshot.attendanceRate);
  const gradient = avatarGradient(index);
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();

  return (
    <button
      onClick={() => router.push(`/parent/students/${student.studentId}`)}
      className="group w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden"
    >
      {/* Card top — coloured band */}
      <div className={`h-2 w-full bg-linear-to-r ${gradient}`} />

      <div className="p-5 space-y-4">
        {/* Student identity */}
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl bg-linear-to-br ${gradient} flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-sm`}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
              {student.firstName} {student.lastName}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {student.studentNumber}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {student.currentClass && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                  <GraduationCap size={10} />
                  {student.currentClass.level}
                </span>
              )}
              {student.currentTerm && (
                <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  {student.currentTerm.period} · {student.currentTerm.academicYear.label}
                </span>
              )}
            </div>
          </div>
          <ChevronRight
            size={18}
            className="text-gray-300 group-hover:text-blue-500 transition-colors shrink-0"
          />
        </div>

        {/* Attendance bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Attendance</span>
            <span className={`text-xs font-semibold ${colors.text}`}>
              {student.snapshot.attendanceRate}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
              style={{ width: `${Math.min(student.snapshot.attendanceRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Snapshot stats */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="flex flex-col items-center bg-gray-50 rounded-xl py-2.5 px-1">
            <TrendingUp size={14} className="text-blue-500 mb-1" />
            <p className="text-base font-bold text-gray-900">
              {student.snapshot.attendanceRate}%
            </p>
            <p className="text-[10px] text-gray-400 text-center leading-tight">Attend&shy;ance</p>
          </div>
          <div className="flex flex-col items-center bg-gray-50 rounded-xl py-2.5 px-1">
            <BookOpen size={14} className="text-indigo-500 mb-1" />
            <p className="text-base font-bold text-gray-900">
              {student.snapshot.totalSubjects}
            </p>
            <p className="text-[10px] text-gray-400 text-center leading-tight">Subjects</p>
          </div>
          <div className="flex flex-col items-center bg-gray-50 rounded-xl py-2.5 px-1">
            <FileText size={14} className="text-emerald-500 mb-1" />
            <p className="text-base font-bold text-gray-900">
              {student.snapshot.publishedCards}
            </p>
            <p className="text-[10px] text-gray-400 text-center leading-tight">Report Cards</p>
          </div>
        </div>
      </div>
    </button>
  );
}