import { teacherService } from "@/src/services/client/teacher";
import { SaveScoresPayload, ScoreHistoryParams } from "@/src/types";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../useToast";
import { getErrorMessage } from "@/src/utils/error";

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
    queryFn: async () => {
      try{
        return await teacherService.getScoreRoster(classId, subjectId)
      }
      catch(error){
        const message = getErrorMessage(error)
        const { error: showError } = useToast()
      }
    },
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
  const { error: showError } = useToast();
 
  return useMutation({
    mutationFn: async (payload: SaveScoresPayload) => {
      try{
        return await teacherService.saveScores(classId, subjectId, payload)
      }
      catch( error ){
        const message = getErrorMessage(error)
        showError(message)
        return null
      }
    },
    onSuccess: (data) => {
      if(!data) return;
      queryClient.invalidateQueries({ queryKey: scoreKeys.roster(classId, subjectId) });
      queryClient.invalidateQueries({
        queryKey: [...scoreKeys.all, 'history', subjectId, classId],
      });
    },
  });
};


export const useScoreHistory = (params: ScoreHistoryParams) => {
  const { error: showError } = useToast();
  return useQuery({
    queryKey: scoreKeys.history(params.subjectId, params.classId, params),
    queryFn: async () => {
      try{
        return await teacherService.getScoreHistory(params)
      }
      catch(error){
        const message = getErrorMessage(error)
        showError(message);
        return null;
      }
    },
    enabled: !!params.subjectId && !!params.classId,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
};

export const useScoreSheet = (classId: string) => {
  const { error: showError } = useToast();
  return useQuery({
    queryKey: scoreKeys.sheet(classId),
    queryFn: async() => {
      try{
        return await teacherService.getScoreSheet(classId)
      }
      catch(error){
        const message = getErrorMessage(error);
        showError(message);
        return null
      }
    },
    enabled: !!classId,
    staleTime: 60 * 1000, // 1 min — sheet is heavy, don't refetch on every focus
  });
};
 