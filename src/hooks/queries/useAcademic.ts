'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  classService,
  academicYearService,
  termService,
  enrollmentService,
} from '@/src/services/client/academic';
import { queryKeys, queryClient } from '@/src/lib/queryClient';
import {
  CreateClassRequest,
  CreateAcademicYearRequest,
  CreateTermRequest,
} from '@/src/types/api';
import { useToast } from '../useToast';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/src/config/constants';

// Classes
export const useClassesList = (schoolId: string, page = 1, limit = 20) => {
  const { error: toastError } = useToast();

  return useQuery({
    queryKey: queryKeys.classes.list(schoolId, { page, limit }),
    queryFn: async () => {
      try {
        return await classService.list(schoolId, page, limit);
      } catch (error: any) {
        toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
        throw error;
      }
    },
    enabled: !!schoolId,
  });
};

export const useClassDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.classes.detail(id),
    queryFn: () => classService.get(id),
    enabled: !!id,
  });
};

export const useCreateClassMutation = () => {
  const { success, error: toastError } = useToast();

  return useMutation({
    mutationFn: (data: CreateClassRequest) => classService.create(data),
    onSuccess: () => {
      success(SUCCESS_MESSAGES.CREATED_SUCCESS);
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
    },
    onError: (error: any) => {
      toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
    },
  });
};

// Academic Years
export const useAcademicYearsList = (schoolId: string, page = 1, limit = 20) => {
  const { error: toastError } = useToast();

  return useQuery({
    queryKey: queryKeys.academicYears.list(schoolId, { page, limit }),
    queryFn: async () => {
      try {
        return await academicYearService.list(schoolId, page, limit);
      } catch (error: any) {
        toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
        throw error;
      }
    },
    enabled: !!schoolId,
  });
};

export const useActiveAcademicYear = (schoolId: string) => {
  return useQuery({
    queryKey: [...queryKeys.academicYears.all, schoolId, 'active'],
    queryFn: () => academicYearService.getActive(schoolId),
    enabled: !!schoolId,
  });
};

export const useCreateAcademicYearMutation = () => {
  const { success, error: toastError } = useToast();

  return useMutation({
    mutationFn: (data: CreateAcademicYearRequest) =>
      academicYearService.create(data),
    onSuccess: () => {
      success(SUCCESS_MESSAGES.CREATED_SUCCESS);
      queryClient.invalidateQueries({ queryKey: queryKeys.academicYears.all });
    },
    onError: (error: any) => {
      toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
    },
  });
};

// Terms
export const useTermsList = (academicYearId: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['terms', academicYearId, page, limit],
    queryFn: () => termService.list(academicYearId, page, limit),
    enabled: !!academicYearId,
  });
};

export const useCreateTermMutation = () => {
  const { success, error: toastError } = useToast();

  return useMutation({
    mutationFn: (data: CreateTermRequest) => termService.create(data),
    onSuccess: () => {
      success(SUCCESS_MESSAGES.CREATED_SUCCESS);
      queryClient.invalidateQueries({ queryKey: ['terms'] });
    },
    onError: (error: any) => {
      toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
    },
  });
};


export const useEnrollmentList = (schoolId: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['enrollments', schoolId, page, limit],  // schoolId in key so cache is per-school
    queryFn:  () => enrollmentService.list(schoolId, page, limit),
    enabled:  !!schoolId,
  });
};

export const useExtractEnrollment = (studentId: string, academicYearId: string) => {
  return useQuery({
    queryKey: queryKeys.enrollments.extract(studentId, academicYearId),
    queryFn: () => enrollmentService.extract(studentId, academicYearId),
    enabled: !!studentId && !!academicYearId,
  })
}
