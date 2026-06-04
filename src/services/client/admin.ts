import { createApiClient } from '@/src/config/api';
import {
  User,
  Class,
  CreateClassRequest,
  Subject,
  CreateSubjectRequest,
  AcademicYear,
  CreateAcademicYearRequest,
  Term,
  CreateTermRequest,
} from '@/src/types/api';
import { CreateUserFormData } from '@/src/validators/adminSchema';

const API_BASE = '/api/admin';

export const adminService = {
  // Dashboard Stats
  getStats: () => createApiClient().get(`${API_BASE}/stats`),

  // User Management
  getUsers: (params?: { role?: string; search?: string; page?: number; limit?: number }) =>
    createApiClient().get(`${API_BASE}/users`, { params }),

  getUserById: (id: string) => createApiClient().get(`${API_BASE}/users/${id}`),

  createUser: (data: CreateUserFormData) => createApiClient().post(`${API_BASE}/create-user`, data),

  updateUser: (id: string, data: Partial<CreateUserFormData>) =>
    createApiClient().put(`${API_BASE}/users/${id}`, data),

  deleteUser: (id: string) => createApiClient().delete(`${API_BASE}/users/${id}`),

  bulkCreateUsers: (data: CreateUserFormData[]) =>
    createApiClient().post(`${API_BASE}/users/bulk`, data),


  // Classes Management
  getClasses: (params?: { academicYearId?: string; page?: number; limit?: number }) =>
    createApiClient().get(`${API_BASE}/classes`, { params }),

  getClassById: (id: string) => createApiClient().get(`${API_BASE}/classes/${id}`),

  createClass: (data: CreateClassRequest) => createApiClient().post(`${API_BASE}/classes`, data),

  updateClass: (id: string, data: Partial<CreateClassRequest>) =>
    createApiClient().put(`${API_BASE}/classes/${id}`, data),

  deleteClass: (id: string) => createApiClient().delete(`${API_BASE}/classes/${id}`),
  getClassStudents: (classId: string) =>

    createApiClient().get(`${API_BASE}/classes/${classId}/students`),

  // Subject Management
  getSubjects: (params?: { page?: number; limit?: number; search?: string }) =>
    createApiClient().get(`${API_BASE}/subjects`, { params }),

  getSubjectById: (id: string) => createApiClient().get(`${API_BASE}/subjects/${id}`),

  createSubject: (data: CreateSubjectRequest) =>
    createApiClient().post(`${API_BASE}/subjects/create`, data),

  updateSubject: (id: string, data: Partial<CreateSubjectRequest>) =>
    createApiClient().put(`${API_BASE}/subjects/${id}`, data),

  deleteSubject: (id: string) => createApiClient().delete(`${API_BASE}/subjects/${id}`),

  assignTeacherToSubject: (subjectId: string, teacherId: string) =>
    createApiClient().post(`${API_BASE}/subjects/${subjectId}/assign`, { teacherId }),

  // Academic Year Management
  getAcademicYears: (params?: { page?: number; limit?: number }) =>
    createApiClient().get(`${API_BASE}/academic-years`, { params }),

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
};
