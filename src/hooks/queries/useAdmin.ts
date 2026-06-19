import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/src/services/client/admin';
import { useToast } from '@/src/hooks/useToast';
import {
  CreateClassRequest,
  CreateSubjectRequest,
  CreateAcademicYearRequest,
} from '@/src/types/api';
import { CreateUserFormData } from '@/src/validators/adminSchema';
import { AssignClassTeacherPayload, AssignSubjectTeacherPayload } from '@/src/utils/teacher';
import { TeachersListParams } from '@/src/types';

const queryKeys = {
  admin: ['admin'],
  stats: () => [...queryKeys.admin, 'stats'],
  users: () => [...queryKeys.admin, 'users'],
  userById: (id: string) => [...queryKeys.admin, 'users', id],
  classes: () => [...queryKeys.admin, 'classes'],
  classById: (id: string) => [...queryKeys.admin, 'classes', id],
  subjects: () => [...queryKeys.admin, 'subjects'],
  subjectById: (id: string) => [...queryKeys.admin, 'subjects', id],
  academicYears: () => [...queryKeys.admin, 'academicYears'],
  academicYearById: (id: string) => [...queryKeys.admin, 'academicYears', id],
  terms: (academicYearId: string) => [...queryKeys.admin, 'terms', academicYearId],
  timetable: (classId?: string) => [...queryKeys.admin, 'timetable', classId],
  reports: () => [...queryKeys.admin, 'reports'],
  settings: () => [...queryKeys.admin, 'settings'],
  teachers: () => [...queryKeys.admin, 'subjects']
};

// Stats Queries
export const useAdminStats = () => {
  return useQuery({
    queryKey: queryKeys.stats(),
    queryFn: () => adminService.getStats(),
    staleTime: 5 * 60 * 1000,
  });
};

// User Queries
export const useUsersList = (params?: { role?: string; search?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...queryKeys.users(), params],
    queryFn: () => adminService.getUsers(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useUserById = (id: string) => {
  return useQuery({
    queryKey: queryKeys.userById(id),
    queryFn: () => adminService.getUserById(id),
    enabled: !!id,
  });
};

export const useAdminById = (id: string) => {
  return useQuery({
    queryKey: queryKeys.userById(id),
    queryFn: () => adminService.getAdmin(id),
    enabled: !!id,
  });
};

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: (data: CreateUserFormData) => adminService.createUser(data),
    onSuccess: () => {
      success('User created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    },
    onError: (err: any) => {
      showError(err?.response?.data?.error || 'Failed to create user');
    },
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateUserFormData> }) =>
      adminService.updateUser(id, data),
    onSuccess: (_, { id }) => {
      success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.userById(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    },
    onError: (err: any) => {
      showError(err?.response?.data?.error || 'Failed to update user');
    },
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    },
    onError: (err: any) => {
      showError(err?.response?.data?.error || 'Failed to delete user');
    },
  });
};

// Class Queries
export const useClassesList = (params?: { academicYearId?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...queryKeys.classes(), params],
    queryFn: () => adminService.getClasses(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateClassMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: (data: CreateClassRequest) => adminService.createClass(data),
    onSuccess: () => {
      success('Class created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.classes() });
    },
    onError: (err: any) => {
      showError(err?.response?.data?.error || 'Failed to create class');
    },
  });
};

export const useAssignClassTeacherMutation = () => {
  const queryClient = useQueryClient();
  const { success } = useToast()
  return useMutation({
    mutationFn: (payload: AssignClassTeacherPayload) => adminService.assignTeacherToCLass(payload),
    onSuccess: () => {
      success('Teacher assigned to class')
    }
  })
}

export const useTeachersList = (params?: TeachersListParams) => {
  return useQuery({
    queryKey: [...queryKeys.teachers(), params],
    queryFn: () => adminService.getTeachers(params),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData, // avoids list flicker between keystrokes
  });
};


// Subject Queries
export const useSubjectsList = (params?: { page?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: [...queryKeys.subjects(), params],
    queryFn: () => adminService.getSubjects(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateSubjectMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: (data: CreateSubjectRequest) => adminService.createSubject(data),
    onSuccess: () => {
      success('Subject created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects() });
    },
    onError: (err: any) => {
      showError(err?.response?.data?.error || 'Failed to create subject');
    },
  });
};

export const useAssignSubjectTeacherMutation = () => {
  const queryClient = useQueryClient();
  const { success } = useToast()
 
  return useMutation({
    mutationFn: (payload: AssignSubjectTeacherPayload) =>
      adminService.assignSubjectToTeacher(payload),
    onSuccess: () => {
      // Subject list includes subjectTeachers — refetch so the "Teacher"
      // column reflects the new assignment without a manual page refresh.
      success('Teacher assigned successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects() });
    },
  });
};

// Academic Year Queries
export const useAcademicYearsList = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...queryKeys.academicYears(), params],
    queryFn: () => adminService.getAcademicYears(params),
    staleTime: 5 * 60 * 1000,
  });
};


export const useCreateAcademicYearMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: (data: CreateAcademicYearRequest) => adminService.createAcademicYear(data),
    onSuccess: () => {
      success('Academic year created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.academicYears() });
    },
    onError: (err: any) => {
      showError(err?.response?.data?.error || 'Failed to create academic year');
    },
  });
};

// Timetable Queries
export const useTimetable = (classId?: string) => {
  return useQuery({
    queryKey: queryKeys.timetable(classId),
    queryFn: () => adminService.getTimetable(classId),
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  });
};

// Settings Queries
export const useSettings = () => {
  return useQuery({
    queryKey: queryKeys.settings(),
    queryFn: () => adminService.getSettings(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useUpdateSettingsMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adminService.updateSettings(data),
    onSuccess: () => {
      success('Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.settings() });
    },
    onError: (err: any) => {
      showError(err?.response?.data?.error || 'Failed to update settings');
    },
  });
};
