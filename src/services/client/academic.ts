import { getApiClient } from '@/src/config/api';
import { API_ENDPOINTS } from '@/src/config/constants';
import {
  Class,
  CreateClassRequest,
  AcademicYear,
  CreateAcademicYearRequest,
  Term,
  CreateTermRequest,
  PaginatedResponse,
} from '@/src/types/api';

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
