'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { userService } from '@/src/services/client/user';
import { studentService, parentService } from '@/src/services/client/student';
import { queryKeys, queryClient } from '@/src/lib/queryClient';
import { CreateUserRequest } from '@/src/types/api';
import { useToast } from '../useToast';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/src/config/constants';
import { teacherService } from '@/src/services/client/teacher';

// Users
export const useUsersList = (
  schoolId: string,
  page = 1,
  limit = 20,
  filters?: { role?: string; search?: string }
) => {
  const { error: toastError } = useToast();

  return useQuery({
    queryKey: queryKeys.users.list(schoolId, { page, limit, ...filters }),
    queryFn: async () => {
      try {
        return await userService.list(schoolId, page, limit, filters);
      } catch (error: any) {
        toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
        throw error;
      }
    },
    enabled: !!schoolId,
  });
};

export const useUserDetail = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => userService.get(userId),
    enabled: !!userId,
  });
};

export const useCreateUserMutation = () => {
  const { success, error: toastError } = useToast();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => userService.create(data),
    onSuccess: () => {
      success(SUCCESS_MESSAGES.CREATED_SUCCESS);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: (error: any) => {
      toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
    },
  }); 
};

export const useSearchUsers = (schoolId: string, query: string, role?: string) => {
  return useQuery({
    queryKey: queryKeys.users.list(schoolId, { search: query, role }),
    queryFn: () => userService.search(schoolId, query, role),
    enabled: !!schoolId && query.length > 0,
  });
};

// Students
export const useStudentsList = (
  schoolId: string,
  page = 1,
  limit = 20,
  filters?: { classId?: string; level?: string; search?: string }
) => {
  const { error: toastError } = useToast();

  return useQuery({
    queryKey: queryKeys.students.list(schoolId, { page, limit, ...filters }),
    queryFn: async () => {
      try {
        return await studentService.list(schoolId, page, limit, filters);
      } catch (error: any) {
        toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
        throw error;
      }
    },
    enabled: !!schoolId,
  });
};

export const useStudentDetail = (studentId: string) => {
  return useQuery({
    queryKey: queryKeys.students.detail(studentId),
    queryFn: () => studentService.get(studentId),
    enabled: !!studentId,
  });
};

export const useLinkParentMutation = () => {
  const { success, error: toastError } = useToast();

  return useMutation({
    mutationFn: ({
      studentId,
      parentIds,
    }: {
      studentId: string;
      parentIds: string[];
    }) => studentService.linkParent(studentId, parentIds),
    onSuccess: () => {
      success(SUCCESS_MESSAGES.UPDATED_SUCCESS);
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    },
    onError: (error: any) => {
      toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
    },
  });
};

// Parents
export const useParentsList = (schoolId: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['parents', schoolId, page, limit],
    queryFn: () => parentService.list(schoolId, page, limit),
    enabled: !!schoolId,
  });
};

export const useSearchParents = (schoolId: string, query: string) => {
  return useQuery({
    queryKey: ['parents', schoolId, 'search', query],
    queryFn: () => parentService.search(schoolId, query),
    enabled: !!schoolId && query.length > 0,
  });
};


export const useMyClass = () => {
  return useQuery({
    queryKey: queryKeys.teachers.myClass(),
    queryFn: () => teacherService.getMyClass(),
    staleTime: 5 * 60 * 1000, // class assignment rarely changes mid-session
  });
};
