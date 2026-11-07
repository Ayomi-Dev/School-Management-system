import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../useToast";
import { adminService } from "@/src/services/client/admin";
import { getErrorMessage } from "@/src/utils/error";
import { queryKeys } from "./useAdmin";
import { AssignClassTeacherPayload } from "@/app/(protected)/dashboard/teacher/components/teacher";
import { CreateClassRequest } from "@/src/types";

export const useClassesList = (params?: { academicYearId?: string; page?: number; limit?: number }) => {
  const {error: showError} = useToast()
  return useQuery({
    queryKey: [...queryKeys.classes(), params],
   queryFn: async() => {
      try {
        return await adminService.getClasses(params)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    staleTime: 2 * 60 * 1000,
  });
};


export const useCreateClassMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async(data: CreateClassRequest) => {
      try{
        return await adminService.createClass(data)  
      }
      catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if(!data) return;
      success('Class created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.classes() });
    },
  });
};

export const useAssignClassTeacherMutation = () => {
  const queryClient = useQueryClient();
  const { success } = useToast()
  return useMutation({
    mutationFn: (payload: AssignClassTeacherPayload) => adminService.assignTeacherToCLass(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers() });
      success('Teacher assigned to class')
    }
  })
}

export const useUnassignClassTeacherMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: (teacherId: string) => adminService.unassignTeacherFromClass(teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers() });
      success('Teacher unassigned from class');
    },
    onError: (error) => showError(getErrorMessage(error)),
  });
};

export const useClassDetail = (classId: string) => {
  const { error: showError } = useToast();
    return useQuery({
    queryKey: queryKeys.classDetail(classId),
    queryFn: async() => {
      try {
        return await adminService.getClassDetail(classId)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    enabled:  !!classId,
  });
}
 
// ─── Class: score sheet ────────────────────────────────────────────────────────
export const useClassScoreSheet = (classId: string, enabled: boolean) => {
  const { error: showError } = useToast()
    return useQuery({
    queryKey: queryKeys.classScoreSheet(classId),
    queryFn: async() => {
      try {
        return await adminService.getClassScoreSheet(classId)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    enabled:  enabled && !!classId,
  });

}
