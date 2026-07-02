import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/src/services/client/admin';
import { useToast } from '@/src/hooks/useToast';
import {
  CreateClassRequest,
  CreateSubjectRequest,
  CreateAcademicYearRequest,
  StudentAcademicSummaryResponse,
} from '@/src/types/api';
import { CreateUserFormData } from '@/src/validators/adminSchema';
import { AssignClassTeacherPayload, AssignSubjectTeacherPayload } from '@/app/(protected)/dashboard/teacher/components/teacher';
import { TeachersListParams, UserStatus } from '@/src/types';
import { queryClient } from '@/src/lib/queryClient';

const queryKeys = {
  admin: ['admin'],
  stats: () => [...queryKeys.admin, 'stats'],
  users: () => [...queryKeys.admin, 'users'],
  userById: (id: string) => [...queryKeys.admin, 'users', id],
  classes: () => [...queryKeys.admin, 'classes'],
  classDetail: (classId: string) => [...queryKeys.admin, 'classes', classId],
  subjects: () => [...queryKeys.admin, 'subjects'],
  subjectById: (id: string) => [...queryKeys.admin, 'subjects', id],
  academicYears: () => [...queryKeys.admin, 'academicYears'],
  academicYearById: (id: string) => [...queryKeys.admin, 'academicYears', id],
  terms: (academicYearId: string) => [...queryKeys.admin, 'terms', academicYearId],
  timetable: (classId?: string) => [...queryKeys.admin, 'timetable', classId],
  reports: () => [...queryKeys.admin, 'reports'],
  settings: () => [...queryKeys.admin, 'settings'],
  teachers: () => [...queryKeys.admin, 'subjects'],
  reportCard:       (reportCardId: string) => ['admin-report-card', reportCardId] as const,
  academicSummary: (userId: string, termId?: string) => ['admin-academic-summary', userId, termId ?? 'all'] as const,
  classScoreSheet: (classId: string) => ['admin-class-scoresheet', classId] as const,
  parentsList: ()=> ['admin-parents-list']               as const,
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
    queryFn: () => adminService.getUserProfile(id),
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

export const useUpdateUserStatusMutation = (userId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
 
  return useMutation({
    mutationFn: (newStatus: UserStatus) =>
      adminService.updateUserStatus(userId, newStatus),
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userById(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
      success(`User status updated to ${newStatus}`);
    },
    onError: () => error('Failed to update user status'),
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

export const useClassDetail = (classId: string) =>
  useQuery({
    queryKey: queryKeys.classDetail(classId),
    queryFn:  () => adminService.getClassDetail(classId),
    enabled:  !!classId,
});
 
// ─── Class: score sheet ────────────────────────────────────────────────────────
export const useClassScoreSheet = (classId: string, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.classScoreSheet(classId),
    queryFn:  () => adminService.getClassScoreSheet(classId),
    enabled:  enabled && !!classId,
  });
 

  //report cards
// ───publish all report cards ──────────────────────────────────────────
export const usePublishClassReportCardsMutation = (classId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
 
  return useMutation({
    mutationFn: () => adminService.publishClassReportCards(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classDetail(classId) });
      success('All report cards published');
    },
    onError: () => error('Failed to publish report cards'),
  });
};

//get single report card
export const useReportCard = (reportCardId: string, enabled: boolean = true) =>
  useQuery({
    queryKey: queryKeys.reportCard(reportCardId),
    queryFn:  () => adminService.getReportCard(reportCardId),
    enabled:  enabled && !!reportCardId,
  });


  //update a student's report card
export const useUpdateReportCardMutation = (reportCardId: string, userId?: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
 
  return useMutation({
    mutationFn: (body: { teacherRemark?: string; principalRemark?: string }) =>
      adminService.updateReportCard(reportCardId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reportCard(reportCardId) });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.academicSummary(userId) });
      }
      success('Report card updated');
    },
    onError: () => error('Failed to update report card'),
  });
};

//publish student's report's card
export const useAdminPublishReportCardMutation = (userId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
 
  return useMutation({
    mutationFn: (reportCardId: string) =>
      adminService.publishReportCard(reportCardId),
    onSuccess: (_, reportCardId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.academicSummary(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportCard(reportCardId) });
      success('Report card published successfully');
    },
    onError: () => error('Failed to publish report card'),
  });
};
export const useAdminUnpublishReportCardMutation = (userId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
 
  return useMutation({
    mutationFn: (reportCardId: string) =>
      adminService.unpublishReportCard(reportCardId),
    onSuccess: (_, reportCardId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.academicSummary(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportCard(reportCardId) });
      success('Report card unpublished successfully');
    },
    onError: () => error('Failed to unpublish report card'),
  });
};
 
 
  //teachers
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
export const useRemoveSubjectTeacherMutation = () => {
  const queryClient = useQueryClient();
  const { success } = useToast()
 
  return useMutation({
    mutationFn: (payload: AssignSubjectTeacherPayload) =>
      adminService.removeSubjectAssignment(payload),
    onSuccess: () => {
      // Subject list includes subjectTeachers — refetch so the "Teacher"
      // column reflects the new assignment without a manual page refresh.
      success('Teacher unassigned successfully');
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

//students
export const useStudentAcademicSummary = (
  userId: string,
  enabled: boolean,
  schoolId: string,
  termId?: string,
) =>
  useQuery<StudentAcademicSummaryResponse>({
    queryKey: queryKeys.academicSummary(userId, termId),
    queryFn:  () => adminService.getStudentAcademicSummary(userId, schoolId, termId),
    enabled:  enabled && !!schoolId && !!userId,
});


//parents
export const useParentsList = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.parentsList(),
    queryFn:  () => adminService.getParentsList(),
    enabled,
    staleTime: 30_000, // parents list changes rarely — cache for 30s
  });

  // Invalidates the student's user profile (which may show a linked guardian)
// and the parents list (linkedCount on the selected parent just changed).
 
export const useLinkStudentToParentMutation = (studentUserId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
 
  return useMutation({
    mutationFn: (parentUserId: string) =>
      adminService.linkStudentToParent(studentUserId, { parentUserId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userById(studentUserId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.parentsList() });
      success(res.message);
    },
    onError: (err: Error) => error(err.message ?? 'Failed to link parent'),
  });
}
 
 
