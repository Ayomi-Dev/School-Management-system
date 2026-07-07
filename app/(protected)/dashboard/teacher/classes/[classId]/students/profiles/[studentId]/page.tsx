"use client"

import { ProfileCard } from '@/src/components/dashboards/student/components'
import { useMyClassStudents } from '@/src/hooks/queries/useTeacher'
import { StudentProfile } from '@/src/types'
import { useParams } from 'next/navigation'

const StudentProfilePage = () => {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const { data: studentsData, isLoading, error } = useMyClassStudents(classId);
  const students = studentsData?.data.students ?? [];
  const currentStudent = students?.find((s) => s.id === studentId);
  

  return (
    // <div className="">profile</div>
    <>
      {currentStudent ? (
        <ProfileCard profile={currentStudent as StudentProfile} />
      ) : (
        <div className="text-center text-gray-500">Student not found.</div>
      )}
    </>
    //
    )
}

export default StudentProfilePage