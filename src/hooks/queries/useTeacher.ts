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
 