import { reportCardService } from '@/src/services/client/reportCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../useToast';
import { getErrorMessage } from '@/src/utils/error';
import { teacherService } from '@/src/services/client/teacher';
import type { ScoreEntry, SaveScoresPayload } from '@/src/types';
 
export const reportCardKeys = {
  all: ['reportCards'] as const,
  listPrefix: (classId: string) => [...reportCardKeys.all, 'list', classId] as const,
  list: (classId: string, academicYearId?: string, termId?: string) => [...reportCardKeys.all, 'list', classId, academicYearId, termId] as const,
  detail: (classId: string, reportCardId: string) =>
    [...reportCardKeys.all, 'detail', classId, reportCardId] as const,
};
 

export const useReportCardList = (classId: string, academicYearId?: string, termId?: string) => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: reportCardKeys.list(classId, academicYearId, termId),
    queryFn: async () => {
      try{
        return await reportCardService.getReportCardList(classId, { academicYearId, termId })
      }
      catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null
      }
    },
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
    staleTime: 0,
    refetchOnMount: 'always',
  });

}

export const useStudentReportSheet = (classId: string, studentId: string) => {
  const { error: showError } = useToast();
  return useQuery({
    queryKey: [...reportCardKeys.all, 'student-sheet', classId, studentId],
    queryFn: async () => {
      try {
        return await reportCardService.getStudentReportSheet(classId, studentId);
      } catch (error) {
        showError(getErrorMessage(error));
        throw error;
      }
    },
    enabled: !!classId && !!studentId,
  });
};
 
export const useCompileReportCard = (classId: string) => {
  const { success, error: showError } = useToast()
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async(studentId: string) => {
      return await reportCardService.compileReportCard(classId, studentId)
    },
    onSuccess: (data) => {
      if(!data) return;
      success(data.message ?? 'Report card compiled successfully.');
      // List page needs refreshing to move student from "pending" to
      // "compiled" and reflect updated positions.
      queryClient.invalidateQueries({ queryKey: reportCardKeys.listPrefix(classId) });
    },
    onError: (error) => showError(getErrorMessage(error)),
  });
};

export const useSaveReportCardScores = (classId: string, reportCardId: string) => {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { studentId: string; termId: string; scores: Array<ScoreEntry & { originalCaScore: number | null; originalExamScore: number | null }> }) => {
      for (const score of input.scores) {
        if (score.isPublished) continue;
        const fields: Array<{ field: SaveScoresPayload['field']; value: number | null; original: number | null }> = [
          { field: 'caScore', value: score.caScore, original: score.originalCaScore },
          { field: 'examScore', value: score.examScore, original: score.originalExamScore },
        ];
        for (const { field, value, original } of fields) {
          if (value === original || (value === null && original === null)) continue;
          await teacherService.saveScores(classId, score.subjectId, {
            termId: input.termId,
            field,
            entries: [{ studentId: input.studentId, value }],
          });
        }
      }
      return reportCardService.compileReportCard(classId, input.studentId, input.termId);
    },
    onSuccess: async (data) => {
      success(data.message ?? 'Scores saved and report card updated.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reportCardKeys.detail(classId, reportCardId) }),
        queryClient.invalidateQueries({ queryKey: reportCardKeys.listPrefix(classId) }),
      ]);
    },
    onError: (error) => showError(getErrorMessage(error)),
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
      queryClient.invalidateQueries({ queryKey: reportCardKeys.listPrefix(classId) });
    },
  });
};
