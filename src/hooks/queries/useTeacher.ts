import { queryKeys } from "@/src/lib/queryClient";
import { teacherService } from "@/src/services/client/teacher";
import { useQuery } from "@tanstack/react-query";

export const useMyClass = () => {
  return useQuery({
    queryKey: queryKeys.teachers.myClass(),
    queryFn: () => teacherService.getMyClass(),
    staleTime: 5 * 60 * 1000, // class assignment rarely changes mid-session
  });
};


export const useMyClassStudents = (classId: string) => {
  return useQuery({
    queryKey: queryKeys.teachers.myStudents(),
    queryFn: () => teacherService.getStudentsForMyClass(classId),
    enabled: !!classId,
  })
}

export const useMySubjectsForClass = (classId: string) => {
  return useQuery({
    queryKey: ['teacher', 'mySubjects', classId],
    queryFn: () => teacherService.getMySubjectsForClass(classId),
    enabled: !!classId,
    staleTime: 2 * 60 * 1000,
  });
};

 
export const useMySubjectAssignments = () => {
  return useQuery({
    queryKey: ['teacher', 'mySubjectAssignments'],
    queryFn:  () => teacherService.getMySubjectAssignments(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useTeacherOverview = () => {
  return useQuery({
    queryKey: ['teacher', 'overview'],
    queryFn:  () => teacherService.getOverview(),
    // Overview is the first thing a teacher sees — keep stale time short
    // so it reflects recent marking/score activity without needing a manual
    // refresh. 60s is a reasonable balance between freshness and request
    // volume.
    staleTime: 60 * 1000,
  });
}

 
 