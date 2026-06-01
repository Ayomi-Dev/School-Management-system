'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { schoolService } from '@/src/services/client/school';
import { queryKeys, queryClient } from '@/src/lib/queryClient';
import { CreateSchoolRequest } from '@/src/types/api';
import { useToast } from '../useToast';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/src/config/constants';

export const useSchoolsList = (page = 1, limit = 20) => {
  const { error: toastError } = useToast();

  return useQuery({
    queryKey: queryKeys.schools.list({ page, limit }),
    queryFn: async () => {
      try {
        return await schoolService.list(page, limit);
      } catch (error: any) {
        toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
        throw error;
      }
    },
  });
};

export const useSchoolDetail = (id: string) => {
  const { error: toastError } = useToast();

  return useQuery({
    queryKey: queryKeys.schools.detail(id),
    queryFn: async () => {
      try {
        return await schoolService.get(id);
      } catch (error: any) {
        toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
        throw error;
      }
    },
    enabled: !!id,
  });
};

export const useCreateSchoolMutation = () => {
  const { success, error: toastError } = useToast();

  return useMutation({
    mutationFn: async (data: CreateSchoolRequest) => {
      return await schoolService.create(data);
    },
    onSuccess: () => {
      success(SUCCESS_MESSAGES.CREATED_SUCCESS);
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
    onError: (error: any) => {
      toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
    },
  });
};

export const useUpdateSchoolMutation = () => {
  const { success, error: toastError } = useToast();

  return useMutation({
    mutationFn: async ({
      schoolId,
      data,
    }: {
      schoolId: string;
      data: Partial<CreateSchoolRequest>;
    }) => {
      return await schoolService.update(schoolId, data);
    },
    onSuccess: (_, variables) => {
      success(SUCCESS_MESSAGES.UPDATED_SUCCESS);
      queryClient.invalidateQueries({
        queryKey: queryKeys.schools.detail(variables.schoolId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.lists() });
    },
    onError: (error: any) => {
      toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
    },
  });
};

export const useCreateSchoolAdminMutation = () => {
  const { success, error: toastError } = useToast();

  return useMutation({
    mutationFn: async ({
      schoolId,
      data,
    }: {
      schoolId: string;
      data: {
        email: string;
        firstName: string;
        lastName: string;
        phone?: string;
      };
    }) => {
      return await schoolService.createAdmin(schoolId, data);
    },
    onSuccess: () => {
      success(SUCCESS_MESSAGES.CREATED_SUCCESS);
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
    onError: (error: any) => {
      toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
    },
  });
};
