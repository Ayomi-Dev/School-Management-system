import { reportCardService } from '@/src/services/client/reportCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 
export const reportCardKeys = {
  all: ['reportCards'] as const,
  list: (classId: string) => [...reportCardKeys.all, 'list', classId] as const,
  detail: (classId: string, reportCardId: string) =>
    [...reportCardKeys.all, 'detail', classId, reportCardId] as const,
};
 
export const useReportCardList = (classId: string) =>
  useQuery({
    queryKey: reportCardKeys.list(classId),
    queryFn: () => reportCardService.getReportCardList(classId),
    enabled: !!classId,
    staleTime: 30 * 1000,
  });
 
export const useReportCard = (classId: string, reportCardId: string) =>
  useQuery({
    queryKey: reportCardKeys.detail(classId, reportCardId),
    queryFn: () => reportCardService.getReportCard(classId, reportCardId),
    enabled: !!classId && !!reportCardId,
    staleTime: 30 * 1000,
  });
 
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
 
export const usePublishReportCard = (classId: string, reportCardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reportCardService.publishReportCard(classId, reportCardId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reportCardKeys.detail(classId, reportCardId),
      });
      queryClient.invalidateQueries({ queryKey: reportCardKeys.list(classId) });
    },
  });
};
 