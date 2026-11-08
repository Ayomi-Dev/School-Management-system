import { studentService } from "@/src/services/client/student";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../useToast";
import { getErrorMessage } from "@/src/utils/error";

const studentQueryKeys = {
    student: ["student"],
    studentList: (params?: unknown) => [...studentQueryKeys.student, "studentList", params],
}

export const useStudentList = (params: {
  page?: number;
  limit?: number;
  classId?: string;
  academicYearId?: string;
  search?: string;
  status?: string;
} ) => {
    const { error: showError } = useToast()
    return useQuery({
      queryKey: studentQueryKeys.studentList(params),
      queryFn: async() => {
        try {
          return await studentService.list(params.page, params.limit, params)
        } catch (error) {
          const message = getErrorMessage(error);
          showError(message);
          return null;
        }
      },
      staleTime: 2 * 60 * 1000,
    });
}
