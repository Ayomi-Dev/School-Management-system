import { getApiClient } from '@/src/config/api';
import { API_ENDPOINTS } from '@/src/config/constants';
import {
  Class,
  CreateClassRequest,
  AcademicYear,
  CreateAcademicYearRequest,
  Term,
  CreateTermRequest,
  EnrollmentWithDetails,
} from '@/src/types/api';
import { PaginatedResponse } from '@/src/types';

const client = getApiClient();

export const classService = {
  list: async (
    schoolId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Class>> => {
    const response = await client.get(API_ENDPOINTS.CLASSES_LIST(schoolId), {
      params: { page, limit },
    });
    return response.data;
  },

  create: async (data: CreateClassRequest): Promise<Class> => {
    const response = await client.post(API_ENDPOINTS.CLASSES_CREATE, data);
    return response.data;
  },

  get: async (id: string): Promise<Class> => {
    const response = await client.get(API_ENDPOINTS.CLASSES_GET(id));
    return response.data;
  },

  update: async (id: string, data: Partial<CreateClassRequest>): Promise<Class> => {
    const response = await client.post(API_ENDPOINTS.CLASSES_UPDATE(id), data);
    return response.data;
  },
};

export const academicYearService = {
  list: async (
    schoolId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<AcademicYear>> => {
    const response = await client.get(API_ENDPOINTS.ACADEMIC_YEARS_LIST(schoolId), {
      params: { page, limit },
    });
    return response.data;
  },

  create: async (data: CreateAcademicYearRequest): Promise<AcademicYear> => {
    const response = await client.post(API_ENDPOINTS.ACADEMIC_YEARS_CREATE, data);
    return response.data;
  },

  getActive: async (schoolId: string): Promise<AcademicYear> => {
    const response = await client.get(API_ENDPOINTS.ACADEMIC_YEARS_LIST(schoolId), {
      params: { isActive: true, limit: 1 },
    });
    return response.data.data[0];
  },
};

export const termService = {
  list: async (
    academicYearId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Term>> => {
    const response = await client.get(API_ENDPOINTS.TERMS_LIST(academicYearId), {
      params: { page, limit },
    });
    return response.data;
  },

  create: async (data: CreateTermRequest): Promise<Term> => {
    const response = await client.post(API_ENDPOINTS.TERMS_CREATE, data);
    return response.data;
  },
};

export const enrollmentService = {
  list: async (schoolId: string, page = 1, limit = 20) => {
    const response = await client.get(
      API_ENDPOINTS.ENROLLMENTS_LIST(schoolId),
      { params: { page, limit } }
    );
    return response.data as {
      data: EnrollmentWithDetails[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    };
  },
  extract: async(studentId: string, academicYearId: string) => {
    const response = await client.get(
      API_ENDPOINTS.EXTRACT_ENROLLMENT(studentId, academicYearId), { params: { academicYearId }}
    )
    return response.data
  }
};
// lib/api/enrollments.ts
// export const enrollmentsApi = {
//   getAll: async (filters?: { academicYearId?: string; classId?: string }) => {
//     const params = new URLSearchParams(filters as Record<string, string>);
//     const res = await axiosInstance.get(`/enrollments?${params}`);
//     return res.data.data;
//   },

//   extractForStudent: async (studentId: string, academicYearId: string) => {
//     const res = await axiosInstance.get(
//       `/enrollments/${studentId}/extract?academicYearId=${academicYearId}`
//     );
//     return res.data.data;
//   },
// };
