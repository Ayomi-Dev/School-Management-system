import { getApiClient } from '@/src/config/api';
import { API_ENDPOINTS } from '@/src/config/constants';
import { TeachersListParams, TeachersListResponse, UserStatus } from '@/src/types';
import {
  CreateClassRequest,
  CreateSubjectRequest,
  CreateAcademicYearRequest,
  CreateTermRequest,
  StudentAcademicSummaryResponse,
  Class,
} from '@/src/types/api';
import { AssignClassTeacherPayload, AssignSubjectTeacherPayload } from '@/app/(protected)/dashboard/teacher/components/teacher';
import { CreateUserFormData } from '@/src/validators/adminSchema';
import { ClassDetail, 
  PublishReportCardResponse, 
  ReportCardFullDetail, 
  ScoreSheet, 
  UnpublishReportCardResponse, 
  UpdateReportCardBody, 
  UpdateReportCardResponse, 
  UpdateUserStatusResponse, 
  UserProfile,
  ParentListItem,
  LinkStudentToParentBody,
  LinkStudentToParentResponse
 } from '@/src/types/admin';

const API_BASE = '/api/admin';

export const adminService = {
  // Dashboard Stats
  getStats: () => getApiClient().get(`${API_BASE}/stats`),

  // User Management
  getUsers: (params?: { role?: string; search?: string; page?: number; limit?: number }) =>
    getApiClient().get(API_ENDPOINTS.USERS_LIST, { params }),

  getUserProfile: async(id: string): Promise<UserProfile> => {
    const response = await getApiClient().get(API_ENDPOINTS.USERS_GET(id))
    return response.data
  },
  getAdmin: (id: string) => getApiClient().get(API_ENDPOINTS.GET_ADMIN_PROFILE(id)),

  createUser: (data: CreateUserFormData) => getApiClient().post(API_ENDPOINTS.USERS_CREATE, data),

  updateUser: (id: string, data: Partial<CreateUserFormData>) =>
    getApiClient().put(API_ENDPOINTS.USERS_UPDATE(id), data),

  updateUserStatus: async (
    userId: string,
    status: UserStatus,
  ): Promise<UpdateUserStatusResponse> => {
    const res = await getApiClient().patch(
      API_ENDPOINTS.UPDATE_USER_STATUS(userId),
      { status },
    );
    return res.data;
  },

  deleteUser: (id: string) => getApiClient().delete(API_ENDPOINTS.USERS_DELETE(id)),

  bulkCreateUsers: (data: CreateUserFormData[]) =>
    getApiClient().post(`${API_BASE}/users/bulk`, data),


  // Classes Management
  getClasses: ( params?: { academicYearId?: string; page?: number; limit?: number }) =>
    getApiClient().get(API_ENDPOINTS.CLASSES_LIST, { params }),

  getClassDetail: async (classId: string): Promise<ClassDetail> => {
    const res = await getApiClient().get(API_ENDPOINTS.CLASSES_GET(classId));
    return res.data.data;
  },
   getClassScoreSheet: async (classId: string): Promise<ScoreSheet> => {
    const res = await getApiClient().get(
      API_ENDPOINTS.CLASS_SCORESHEET(classId),
    );
    return res.data.data;
  },
   publishClassReportCards: async (classId: string): Promise<{ message: string }> => {
    const res = await getApiClient().post(
      API_ENDPOINTS.PUBLISH_CLASS_REPORT_CARDS(classId),
    );
    return res.data.data;
  },


  createClass: (data: CreateClassRequest) => getApiClient().post(API_ENDPOINTS.CLASSES_CREATE, data),

  updateClass: (classId: string, data: Partial<CreateClassRequest>) =>
    getApiClient().put(`${API_BASE}/classes/${classId}`, data),

  deleteClass: (classId: string) => getApiClient().delete(API_ENDPOINTS.CLASSES_DELETE(classId)),
  getClassStudents: (classId: string) => getApiClient().get(`${API_BASE}/classes/${classId}/students`),
  assignTeacherToCLass: (payload: AssignClassTeacherPayload) => getApiClient().post(API_ENDPOINTS.ASSIGN_TEACHER_TO_CLASS, payload),

 

  // Subject Management
  getSubjects: (params?: { page?: number; limit?: number; search?: string }) =>
    getApiClient().get(API_ENDPOINTS.SUBJECTS_LIST, { params }),

  getSubjectById: (id: string) => getApiClient().get(`${API_BASE}/subjects/${id}`),

  createSubject: (data: CreateSubjectRequest) =>
    getApiClient().post(`${API_BASE}/subjects/create`, data),

  updateSubject: (id: string, data: Partial<CreateSubjectRequest>) =>
    getApiClient().put(`${API_BASE}/subjects/${id}`, data),

  deleteSubject: (id: string) => getApiClient().delete(`${API_BASE}/subjects/${id}`),

  assignSubjectToTeacher: (payload: AssignSubjectTeacherPayload) => getApiClient().post(API_ENDPOINTS.SUBJECTS_ASSIGN_TEACHER, payload),
  removeSubjectAssignment: (payLoad: AssignSubjectTeacherPayload) => getApiClient().post(API_ENDPOINTS.SUBJECTS_REMOVE_TEACHER, payLoad),

  // Academic Year Management 
  getAcademicYears: (params?: { page?: number; limit?: number }) =>
    getApiClient().get(`${API_BASE}/academics`, { params }),

  getAcademicYearById: (id: string) => getApiClient().get(`${API_BASE}/academic-years/${id}`),

  createAcademicYear: (data: CreateAcademicYearRequest) =>
    getApiClient().post(`${API_BASE}/academics`, data),

  updateAcademicYear: (id: string, data: Partial<CreateAcademicYearRequest>) =>
    getApiClient().put(`${API_BASE}/academic-years/${id}`, data),

  deleteAcademicYear: (id: string) => getApiClient().delete(`${API_BASE}/academic-years/${id}`),
  activateAcademicYear: (id: string) => getApiClient().patch(`${API_BASE}/academic-years/${id}/activate`),

  // Terms Management
  getTerms: (academicYearId: string, params?: { page?: number; limit?: number }) =>
    getApiClient().get(`${API_BASE}/academic-years/${academicYearId}/terms`, { params }),

  getTermById: (academicYearId: string, termId: string) =>
    getApiClient().get(`${API_BASE}/academic-years/${academicYearId}/terms/${termId}`),

  createTerm: (data: CreateTermRequest) => getApiClient().post(`${API_BASE}/terms`, data),

  updateTerm: (id: string, data: Partial<CreateTermRequest>) =>
    getApiClient().put(`${API_BASE}/terms/${id}`, data),

  deleteTerm: (id: string) => getApiClient().delete(`${API_BASE}/terms/${id}`),

  // Timetable Management
  getTimetable: (classId?: string, params?: { weekDay?: string }) =>
    getApiClient().get(`${API_BASE}/timetable`, { params: { ...params, classId } }),

  createTimetableSlot: (data: {
    classId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }) => getApiClient().post(`${API_BASE}/timetable`, data),

  updateTimetableSlot: (id: string, data: Record<string, unknown>) =>
    getApiClient().put(`${API_BASE}/timetable/${id}`, data),

  deleteTimetableSlot: (id: string) => getApiClient().delete(`${API_BASE}/timetable/${id}`),

  // Reports
  publishReportCard: async (
    reportCardId: string,
  ): Promise<PublishReportCardResponse> => {
    const res = await getApiClient().post(
      API_ENDPOINTS.ADMIN_PUBLISH_REPORT_CARD(reportCardId),
    );
    return res.data;
  },

  unpublishReportCard: async (
    reportCardId: string,
  ): Promise<UnpublishReportCardResponse> => {
    const res = await getApiClient().patch(
      API_ENDPOINTS.ADMIN_UNPUBLISH_REPORT_CARD(reportCardId),
    );
    return res.data;
  },
  getStudentAcademicSummary: async (
    userId: string,
    schoolId: string,
    termId?: string,
  ): Promise<StudentAcademicSummaryResponse> => {
    const res = await getApiClient().get(
      API_ENDPOINTS.GET_STUDENT_ACADEMIC_SUMMARY(userId),
      { params: { schoolId, ...(termId && { termId }) } },
    );
    return res.data;
  },
   getReportCard: async (reportCardId: string): Promise<ReportCardFullDetail> => {
    const res = await getApiClient().get(
      API_ENDPOINTS.GET_REPORT_CARD(reportCardId),
    );
    return res.data.data;
  },
  updateReportCard: async (
    reportCardId: string,
    body: UpdateReportCardBody,
  ): Promise<UpdateReportCardResponse> => {
    const res = await getApiClient().patch(
      API_ENDPOINTS.ADMIN_UPDATE_REPORT_CARD(reportCardId),
      body,
    );
    return res.data;
  },

  getAcademicReport: (params?: { classId?: string; academicYearId?: string }) =>
    getApiClient().get(`${API_BASE}/reports/academic`, { params }),

  getFinancialReport: (params?: { startDate?: string; endDate?: string }) =>
    getApiClient().get(`${API_BASE}/reports/financial`, { params }),

  getAttendanceReport: (params?: { classId?: string; month?: string }) =>
    getApiClient().get(`${API_BASE}/reports/attendance`, { params }),

  // Settings
  getSettings: () => getApiClient().get(`${API_BASE}/settings`),

  updateSettings: (data: Record<string, unknown>) =>
    getApiClient().put(`${API_BASE}/settings`, data),

  getRoles: () => getApiClient().get(`${API_BASE}/roles`),

  getPermissions: () => getApiClient().get(`${API_BASE}/permissions`),

  //teachers
  getTeachers: (params?: TeachersListParams ): Promise<TeachersListResponse> => getApiClient().get(`${API_BASE}/teachers`, { params }),

  //parents
   getParentsList: async (): Promise<ParentListItem[]> => {
    const res = await getApiClient().get(API_ENDPOINTS.GET_PARENTS_LIST());
    return res.data.data;
  },
 
  // Links a student to a parent, creating a Guardian record if absent.
  linkStudentToParent: async (
    studentUserId: string,
    body: LinkStudentToParentBody,
  ): Promise<LinkStudentToParentResponse> => {
    const res = await getApiClient().post(
      API_ENDPOINTS.LINK_STUDENT_TO_PARENT(studentUserId),
      body,
    );
    return res.data;
  },
 
 
};

