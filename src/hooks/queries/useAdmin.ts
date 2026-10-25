import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/src/services/client/admin';
import { useToast } from '@/src/hooks/useToast';
import {
  CreateClassRequest,
  CreateSubjectRequest,
  CreateAcademicYearRequest,
} from '@/src/types/api';
import { CreateUserFormData } from '@/src/validators/adminSchema';
import { AssignClassTeacherPayload, AssignSubjectTeacherPayload } from '@/app/(protected)/dashboard/teacher/components/teacher';
import { TeachersListParams, UserStatusType } from '@/src/types';
import { timetableService } from '@/src/services/client/timetable';
import { CreateTimetableSlotBody, UpdateTimetableSlotBody } from '@/src/types/timetable';
import { getErrorMessage } from '@/src/utils/error';
import { useAuthStore } from '@/src/stores/authStore';
import { queryClient } from '@/src/lib/queryClient';

export const queryKeys = {
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
  reports: () => [...queryKeys.admin, 'reports'],
  settings: () => [...queryKeys.admin, 'settings'],
  teachers: () => [...queryKeys.admin, 'subjects'],
  reportCard:       (reportCardId: string) => ['admin-report-card', reportCardId] as const,
  academicSummary: (userId: string, termId?: string) => ['admin-academic-summary', userId, termId ?? 'all'] as const,
  classScoreSheet: (classId: string) => ['admin-class-scoresheet', classId] as const,
  parentsList: ()=> ['admin-parents-list'] as const,
  timetable:    (classId: string) => ['timetable', classId]         as const,
  classTeachers:(classId: string) => ['timetable-teachers', classId] as const,
};

// Stats Queries
export const useAdminStats = () => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: queryKeys.stats(),
    queryFn: async() => {
      try {
        return await adminService.getStats()
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  }); 
};

// User Queries
export const useUsersList = (params?: { role?: string; search?: string; page?: number; limit?: number }) => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: [...queryKeys.users(), params],
    queryFn: async() => {
      try {
        return await adminService.getUsers(params)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useUserById = (id: string) => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: queryKeys.userById(id),
    queryFn: async() => {
      try {
        return await adminService.getUserProfile(id)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    enabled: !!id,
  });
};

export const useAdminById = (id: string) => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: queryKeys.userById(id),
    queryFn: async() => {
      try {
        return await adminService.getAdmin(id)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    enabled: !!id,
  });
};

export const useCreateUserMutation = () => {
  const { setError: setCreateUserError } = useAuthStore()
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      try {
        return await adminService.createUser(data);
      } 
      catch (error) {
        const message = getErrorMessage(error);
        setCreateUserError(message);
        showError(message);
        return null;
      } 
    },
      // adminService.createUser(data)},
    onSuccess: (data) => {
      if (!data) return;
      success('User created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    }
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async({ id, data }: { id: string; data: Partial<CreateUserFormData> }) => {
      try{
        return await adminService.updateUser(id, data);
      }
      catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (_, { id }) => {
      if (!id) return;
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
  const { success, error: showError } = useToast();
 
  return useMutation({
    mutationFn: async (newStatus: UserStatusType) => {
      try{
        return await adminService.updateUserStatus(userId, newStatus);
      }
      catch( error ){
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (_, newStatus) => {
      if(!newStatus) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.userById(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
      success(`User status updated to ${newStatus}`);
    },
  });
};
 
export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      try{
        return await adminService.deleteUser(id);
      }
      catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if(!data) return;
      success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    },
    
  });
};


 

  //report cards
// ───publish all report cards ──────────────────────────────────────────
export const usePublishClassReportCardsMutation = (classId: string) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
 
  return useMutation({
    mutationFn: async () => {
      try {
        return await adminService.publishClassReportCards(classId)
      } 
      catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if(!data) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.classDetail(classId) });
      success('All report cards published');
    },
  });
};

//get single report card
export const useReportCard = (reportCardId: string, enabled: boolean = true) => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: queryKeys.reportCard(reportCardId),
    queryFn:  async () => {
      try {
        return await adminService.getReportCard(reportCardId)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null; 
      }
    },
    enabled:  enabled && !!reportCardId,
  });
}


  //update a student's report card
export const useUpdateReportCardMutation = (reportCardId: string, userId?: string) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
 
  return useMutation({
    mutationFn: async(body: { teacherRemark?: string; principalRemark?: string }) => {
      try {
        return await adminService.updateReportCard(reportCardId, body)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if(!data) return 
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.academicSummary(userId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.reportCard(reportCardId) });
      success('Report card updated');
    },
  });
};

//publish student's report's card
export const useAdminPublishReportCardMutation = (userId: string) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
 
  return useMutation({
    mutationFn: async(reportCardId: string) => {
      try {
        return await adminService.publishReportCard(reportCardId)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (_, reportCardId) => {
      if(!_  || !reportCardId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.academicSummary(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportCard(reportCardId) });
      success('Report card published successfully');
    },
  });
};
export const useAdminUnpublishReportCardMutation = (userId: string) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
 
  return useMutation({
    mutationFn: async(reportCardId: string) => {
      try {
        return await adminService.unpublishReportCard(reportCardId)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (_, reportCardId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.academicSummary(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportCard(reportCardId) });
      success('Report card unpublished successfully');
    },
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
    mutationFn: async(data: CreateSubjectRequest) => {
      try {
        return await adminService.createSubject(data)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if(!data) return;
      success('Subject created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects() });
    },
  });
};

export const useAssignSubjectTeacherMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast()
 
  return useMutation({
    mutationFn: async(payload: AssignSubjectTeacherPayload) => {
      try {
        return await adminService.assignSubjectToTeacher(payload)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if(!data) return;
      // Subject list includes subjectTeachers — refetch so the "Teacher"
      // column reflects the new assignment without a manual page refresh.
      success('Teacher assigned successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects() });
    },
  });
};

export const useRemoveSubjectTeacherMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast()
 
  return useMutation({
    mutationFn: async (payload: AssignSubjectTeacherPayload) => {
      try {
        return await adminService.removeSubjectAssignment(payload)

      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if(!data) return;
      // Subject list includes subjectTeachers — refetch so the "Teacher"
      // column reflects the new assignment without a manual page refresh.
      success('Teacher unassigned successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects() });
    },
  });
};

// Academic Year Queries
export const useAcademicYearsList = (params?: { page?: number; limit?: number }) => {
  const { error: showError } = useToast();
  return useQuery({
    queryKey: [...queryKeys.academicYears(), params],
    queryFn: async () => {
      try {
        return await adminService.getAcademicYears(params)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};


export const useCreateAcademicYearMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (data: CreateAcademicYearRequest) => {
      try {
        return await adminService.createAcademicYear(data)
      } 
      catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (data) => {
    if(!data) return;
      success('Academic year created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.academicYears() });
    },
  });
};

// Timetable Queries
export const useClassTimetable = (classId: string) => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: queryKeys.timetable(classId),
    queryFn:  async() => {
      try {
       return await timetableService.getTimetable(classId)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    enabled:  !!classId,
  });
}
 
// Fetched only when the create/edit modal opens (enabled flag).
export const useClassTeachers = (classId: string, enabled: boolean) => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: queryKeys.classTeachers(classId),
    queryFn: async() => {
      try {
        return await timetableService.getClassTeachers(classId)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    enabled:  enabled && !!classId,
    staleTime: 60_000,
  });
}
 
export const useCreateSlotMutation = (classId: string) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
 
  return useMutation({
    mutationFn: async(body: CreateTimetableSlotBody) => {
      try {
        return await timetableService.createSlot(classId, body)
      } 
      catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if(!data) return;
      success('Timetable slot added');
      queryClient.invalidateQueries({ queryKey: queryKeys.timetable(classId) });
    },
  });
};
 
export const useUpdateSlotMutation = (classId: string) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
 
  return useMutation({
    mutationFn: async ({ slotId, body }: { slotId: string; body: UpdateTimetableSlotBody }) => {
      try {
        return await timetableService.updateSlot(classId, slotId, body)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if(!data) return
      queryClient.invalidateQueries({ queryKey: queryKeys.timetable(classId) });
      success('Slot updated');
    },
  });
};
 
export const useDeleteSlotMutation = (classId: string) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
 
  return useMutation({
    mutationFn: async (slotId: string) => {
      try {
        return await timetableService.deleteSlot(classId, slotId)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if(!data) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.timetable(classId) });
      success('Slot removed');
    },
  });
};



// Settings Queries
export const useSettings = () => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: queryKeys.settings(),
    queryFn: async() => {
      try {
        return await adminService.getSettings()
      } 
      catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useUpdateSettingsMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async(data: Record<string, unknown>) => {
      try {
       return await adminService.updateSettings(data)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if(!data) return;
      success('Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.settings() });
    }
  });
};

//students
export const useStudentAcademicSummary = (
  userId: string,
  enabled: boolean,
  schoolId: string,
  termId?: string,
) => {
    const { error: showError } = useToast();
    return useQuery({
      queryKey: queryKeys.academicSummary(userId, termId),
      queryFn: async() => {
        try {
          return await adminService.getStudentAcademicSummary(userId, schoolId, termId)
        } 
        catch (error) {
          const message = getErrorMessage(error);
          showError(message);
          return null;
        }
      },
      enabled:  enabled && !!schoolId && !!userId,
    });
}


//parents
export const useParentsList = (enabled: boolean) => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: queryKeys.parentsList(),
    queryFn: async() => {
      try {
        return await adminService.getParentsList()
       
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    enabled,
    staleTime: 30_000, // parents list changes rarely — cache for 30s
  });
}

// Invalidates the student's user profile (which may show a linked guardian)
// and the parents list (linkedCount on the selected parent just changed).
 
export const useLinkStudentToParentMutation = (studentUserId: string) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
 
  return useMutation({
    mutationFn: async (parentUserId: string) => {
      try {
        return await adminService.linkStudentToParent(studentUserId, { parentUserId })
      } 
      catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (res) => {
      if(!res) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.userById(studentUserId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.parentsList() });
      success(res.message);
    },
  });
}
 
 
