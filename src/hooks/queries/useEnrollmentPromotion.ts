'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enrollmentService } from '@/src/services/client/academic';
import { PromoteStudentsRequest } from '@/src/types/enrollment';
import { getErrorMessage } from '@/src/utils/error';
import { useToast } from '@/src/hooks/useToast';

export interface EnrollmentPromotionFilters {
  sourceAcademicYearId?: string;
  sourceClassId?: string;
  targetAcademicYearId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const promotionKey = ['admin-enrollment-promotion'] as const;

export const useEnrollmentPromotionData = (filters: EnrollmentPromotionFilters) => {
  const { error: shoErrorMessage } = useToast()
  return useQuery({
    queryKey: [...promotionKey, filters],
    queryFn: async () => {
      try{
        return await enrollmentService.promotionCandidates(filters)
      }
      catch (error) {
        const message = getErrorMessage(error)
        shoErrorMessage(message)
        return null; // Return null or handle the error as needed
      }
    },
    staleTime: 30_000,
  });

}

export const usePromoteStudents = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (data: PromoteStudentsRequest) => {
      try{
        return await enrollmentService.promote(data);
      }
      catch(error){
        const message = getErrorMessage(error)
        showError(message)
        throw error; // Rethrow the error to trigger onError callback
      }
    },
    onSuccess: async (result) => {
      if(!result) {
        return null
      }
      success(result.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: promotionKey }),
        queryClient.invalidateQueries({ queryKey: ['student'] }),
        queryClient.invalidateQueries({ queryKey: ['student-academic-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-academic-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['enrollments'] }),
      ]);
    },
  });
};
