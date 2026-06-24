import { teacherService } from "@/src/services/client/teacher";
import { SaveScoresPayload, ScoreHistoryParams } from "@/src/types";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const scoreKeys = {
  all: ['scores'] as const,
  roster: (classId: string, subjectId: string) =>
    [...scoreKeys.all, 'roster', classId, subjectId] as const,
  history: (subjectId: string, classId: string, params?: Omit<ScoreHistoryParams, 'subjectId' | 'classId'>) =>
    [...scoreKeys.all, 'history', subjectId, classId, params] as const,
  sheet: (classId: string) => ['scoreSheet', classId] as const,

};


/**
 * Fetches the current-term score roster for a subject in a class. Used by
 * both the CA Scores and Exam Scores pages — same data, different column
 * rendered/edited.
 */
export const useScoreRoster = (classId: string, subjectId: string) => {
  return useQuery({
    queryKey: scoreKeys.roster(classId, subjectId),
    queryFn: () => teacherService.getScoreRoster(classId, subjectId),
    enabled: !!classId && !!subjectId,
    staleTime: 30 * 1000,
  });
};

/**
 * Bulk-saves one field (CA or Exam) across multiple students. Invalidates
 * the roster (recomputed totals/grades) and history on success.
 */
export const useSaveScores = (classId: string, subjectId: string) => {
  const queryClient = useQueryClient();
 
  return useMutation({
    mutationFn: (payload: SaveScoresPayload) =>
      teacherService.saveScores(classId, subjectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scoreKeys.roster(classId, subjectId) });
      queryClient.invalidateQueries({
        queryKey: [...scoreKeys.all, 'history', subjectId, classId],
      });
    },
  });
};


export const useScoreHistory = (params: ScoreHistoryParams) => {
  return useQuery({
    queryKey: scoreKeys.history(params.subjectId, params.classId, params),
    queryFn: () => teacherService.getScoreHistory(params),
    enabled: !!params.subjectId && !!params.classId,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
};

export const useScoreSheet = (classId: string) => {
  return useQuery({
    queryKey: scoreKeys.sheet(classId),
    queryFn: () => teacherService.getScoreSheet(classId),
    enabled: !!classId,
    staleTime: 60 * 1000, // 1 min — sheet is heavy, don't refetch on every focus
  });
};
 