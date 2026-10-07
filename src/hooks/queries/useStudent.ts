import { studentService } from "@/src/services/client/student";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../useToast";
import { getErrorMessage } from "@/src/utils/error";

const studentQueryKeys = {
    student: ["student"],
    studentList: () => [...studentQueryKeys.student, "studentList"]
}

export const useStudentList = () => {
    const { error: showError } = useToast()
    return useQuery({
      queryKey: [...studentQueryKeys.student],
      queryFn: async() => {
        try {
          return await studentService.list()
        } catch (error) {
          const message = getErrorMessage(error);
          showError(message);
          return null;
        }
      },
      staleTime: 2 * 60 * 1000,
    });
}