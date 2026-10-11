import { reportCardService } from '@/src/services/client/reportCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../useToast';
import { getErrorMessage } from '@/src/utils/error';
 
export const reportCardKeys = {
  all: ['reportCards'] as const,
  list: (classId: string) => [...reportCardKeys.all, 'list', classId] as const,
  detail: (classId: string, reportCardId: string) =>
    [...reportCardKeys.all, 'detail', classId, reportCardId] as const,
};
 

export const useReportCardList = (classId: string) => {
  return useQuery({
    queryKey: reportCardKeys.list(classId),
    queryFn: () => reportCardService.getReportCardList(classId),
    enabled: !!classId, 
    staleTime: 30 * 1000,
  });
}
 
export const useSingleReportCard =  (classId: string, reportCardId: string) => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: reportCardKeys.detail(classId, reportCardId),
    queryFn: async() => {
      try {
        return await reportCardService.getSingleReportCard(classId, reportCardId);
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null
      }
    },
    enabled: !!classId && !!reportCardId,
    staleTime: 30 * 1000,
  });

}
 
export const useCompileReportCard = (classId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) =>
      reportCardService.compileReportCard(classId, studentId),
    onSuccess: () => {
      // List page needs refreshing to move student from "pending" to
      // "compiled" and reflect updated positions.
      queryClient.invalidateQueries({ queryKey: reportCardKeys.list(classId) });
    },
  });
};
 
//update remark by teacher
export const useUpdateReportCardRemark = (classId: string, reportCardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teacherRemark: string) =>
      reportCardService.updateReportCardRemark(classId, reportCardId, teacherRemark),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reportCardKeys.detail(classId, reportCardId),
      });
      queryClient.invalidateQueries({ queryKey: reportCardKeys.list(classId) });
    },
  });
};
 
 