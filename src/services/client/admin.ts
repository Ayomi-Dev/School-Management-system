import { createApiClient } from '@/src/config/api';
import { API_ENDPOINTS } from '@/src/config/constants';
import { TeachersListParams, TeachersListResponse, UserStatus } from '@/src/types';
import {
  CreateClassRequest,
  CreateSubjectRequest,
  CreateAcademicYearRequest,
  CreateTermRequest,
  StudentAcademicSummaryResponse,
} from '@/src/types/api';
import { AssignClassTeacherPayload, AssignSubjectTeacherPayload } from '@/app/(protected)/dashboard/teacher/components/teacher';
import { CreateUserFormData } from '@/src/validators/adminSchema';
import { ClassDetail, PublishReportCardResponse, ScoreSheet, UpdateUserStatusResponse, UserProfile } from '@/src/types/admin';

const API_BASE = '/api/admin';

export const adminService = {
  // Dashboard Stats
  getStats: () => createApiClient().get(`${API_BASE}/stats`),

  // User Management
  getUsers: (params?: { role?: string; search?: string; page?: number; limit?: number }) =>
    createApiClient().get(API_ENDPOINTS.USERS_LIST, { params }),

  getUserProfile: async(id: string): Promise<UserProfile> => {
    const response = await createApiClient().get(API_ENDPOINTS.USERS_GET(id))
    return response.data
  },
  getAdmin: (id: string) => createApiClient().get(API_ENDPOINTS.GET_ADMIN_PROFILE(id)),

  createUser: (data: CreateUserFormData) => createApiClient().post(API_ENDPOINTS.USERS_CREATE, data),

  updateUser: (id: string, data: Partial<CreateUserFormData>) =>
    createApiClient().put(API_ENDPOINTS.USERS_UPDATE(id), data),

  updateUserStatus: async (
    userId: string,
    status: UserStatus,
  ): Promise<UpdateUserStatusResponse> => {
    const res = await createApiClient().patch(
      API_ENDPOINTS.UPDATE_USER_STATUS(userId),
      { status },
    );
    return res.data;
  },

  deleteUser: (id: string) => createApiClient().delete(API_ENDPOINTS.USERS_DELETE(id)),

  bulkCreateUsers: (data: CreateUserFormData[]) =>
    createApiClient().post(`${API_BASE}/users/bulk`, data),


  // Classes Management
  getClasses: ( params?: { academicYearId?: string; page?: number; limit?: number }) =>
    createApiClient().get(API_ENDPOINTS.CLASSES_LIST, { params }),

  getClassDetail: async (classId: string): Promise<ClassDetail> => {
    const res = await createApiClient().get(API_ENDPOINTS.CLASSES_GET(classId));
    return res.data.data;
  },
   getClassScoreSheet: async (classId: string): Promise<ScoreSheet> => {
    const res = await createApiClient().get(
      API_ENDPOINTS.CLASS_SCORESHEET(classId),
    );
    return res.data.data;
  },
   publishClassReportCards: async (classId: string): Promise<{ message: string }> => {
    const res = await createApiClient().post(
      API_ENDPOINTS.PUBLISH_CLASS_REPORT_CARDS(classId),
    );
    return res.data.data;
  },


  createClass: (data: CreateClassRequest) => createApiClient().post(API_ENDPOINTS.CLASSES_CREATE, data),

  updateClass: (classId: string, data: Partial<CreateClassRequest>) =>
    createApiClient().put(`${API_BASE}/classes/${classId}`, data),

  deleteClass: (classId: string) => createApiClient().delete(API_ENDPOINTS.CLASSES_DELETE(classId)),
  getClassStudents: (classId: string) => createApiClient().get(`${API_BASE}/classes/${classId}/students`),
  assignTeacherToCLass: (payload: AssignClassTeacherPayload) => createApiClient().post(API_ENDPOINTS.ASSIGN_TEACHER_TO_CLASS, payload),

 

  // Subject Management
  getSubjects: (params?: { page?: number; limit?: number; search?: string }) =>
    createApiClient().get(API_ENDPOINTS.SUBJECTS_LIST, { params }),

  getSubjectById: (id: string) => createApiClient().get(`${API_BASE}/subjects/${id}`),

  createSubject: (data: CreateSubjectRequest) =>
    createApiClient().post(`${API_BASE}/subjects/create`, data),

  updateSubject: (id: string, data: Partial<CreateSubjectRequest>) =>
    createApiClient().put(`${API_BASE}/subjects/${id}`, data),

  deleteSubject: (id: string) => createApiClient().delete(`${API_BASE}/subjects/${id}`),

  assignSubjectToTeacher: (payload: AssignSubjectTeacherPayload) => createApiClient().post(API_ENDPOINTS.SUBJECTS_ASSIGN_TEACHER, payload),
  removeSubjectAssignment: (payLoad: AssignSubjectTeacherPayload) => createApiClient().post(API_ENDPOINTS.SUBJECTS_REMOVE_TEACHER, payLoad),

  // Academic Year Management
  getAcademicYears: (params?: { page?: number; limit?: number }) =>
    createApiClient().get(`${API_BASE}/academics`, { params }),

  getAcademicYearById: (id: string) => createApiClient().get(`${API_BASE}/academic-years/${id}`),

  createAcademicYear: (data: CreateAcademicYearRequest) =>
    createApiClient().post(`${API_BASE}/academic-years`, data),

  updateAcademicYear: (id: string, data: Partial<CreateAcademicYearRequest>) =>
    createApiClient().put(`${API_BASE}/academic-years/${id}`, data),

  deleteAcademicYear: (id: string) => createApiClient().delete(`${API_BASE}/academic-years/${id}`),
  activateAcademicYear: (id: string) => createApiClient().patch(`${API_BASE}/academic-years/${id}/activate`),

  // Terms Management
  getTerms: (academicYearId: string, params?: { page?: number; limit?: number }) =>
    createApiClient().get(`${API_BASE}/academic-years/${academicYearId}/terms`, { params }),

  getTermById: (academicYearId: string, termId: string) =>
    createApiClient().get(`${API_BASE}/academic-years/${academicYearId}/terms/${termId}`),

  createTerm: (data: CreateTermRequest) => createApiClient().post(`${API_BASE}/terms`, data),

  updateTerm: (id: string, data: Partial<CreateTermRequest>) =>
    createApiClient().put(`${API_BASE}/terms/${id}`, data),

  deleteTerm: (id: string) => createApiClient().delete(`${API_BASE}/terms/${id}`),

  // Timetable Management
  getTimetable: (classId?: string, params?: { weekDay?: string }) =>
    createApiClient().get(`${API_BASE}/timetable`, { params: { ...params, classId } }),

  createTimetableSlot: (data: {
    classId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }) => createApiClient().post(`${API_BASE}/timetable`, data),

  updateTimetableSlot: (id: string, data: Record<string, unknown>) =>
    createApiClient().put(`${API_BASE}/timetable/${id}`, data),

  deleteTimetableSlot: (id: string) => createApiClient().delete(`${API_BASE}/timetable/${id}`),

  // Reports
  publishReportCard: async (
    reportCardId: string,
  ): Promise<PublishReportCardResponse> => {
    const res = await createApiClient().post(
      API_ENDPOINTS.PUBLISH_REPORT_CARD(reportCardId),
    );
    return res.data;
  },
  getStudentAcademicSummary: async (
    userId: string,
    schoolId: string,
    termId?: string,
  ): Promise<StudentAcademicSummaryResponse> => {
    const res = await createApiClient().get(
      API_ENDPOINTS.GET_STUDENT_ACADEMIC_SUMMARY(userId),
      { params: { schoolId, ...(termId && { termId }) }},
    );
    return res.data;
  },
  

  getAcademicReport: (params?: { classId?: string; academicYearId?: string }) =>
    createApiClient().get(`${API_BASE}/reports/academic`, { params }),

  getFinancialReport: (params?: { startDate?: string; endDate?: string }) =>
    createApiClient().get(`${API_BASE}/reports/financial`, { params }),

  getAttendanceReport: (params?: { classId?: string; month?: string }) =>
    createApiClient().get(`${API_BASE}/reports/attendance`, { params }),

  // Settings
  getSettings: () => createApiClient().get(`${API_BASE}/settings`),

  updateSettings: (data: Record<string, unknown>) =>
    createApiClient().put(`${API_BASE}/settings`, data),

  getRoles: () => createApiClient().get(`${API_BASE}/roles`),

  getPermissions: () => createApiClient().get(`${API_BASE}/permissions`),

  //teachers
  getTeachers: (params?: TeachersListParams ): Promise<TeachersListResponse> => createApiClient().get(`${API_BASE}/teachers`, { params }),

 
};

