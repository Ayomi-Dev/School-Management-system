import { getApiClient } from '@/src/config/api';
import { API_ENDPOINTS } from '@/src/config/constants';
import { PaginatedResponse } from '@/src/types';
import { StudentProfile, ParentProfile, StudentAcademicSummaryResponse } from '@/src/types/api';

const client = getApiClient();

export const studentService = {
  list: async (
    schoolId: string,
    page = 1,
    limit = 20,
    filters?: { classId?: string; level?: string; search?: string }
  ): Promise<PaginatedResponse<StudentProfile>> => {
    const response = await client.get(API_ENDPOINTS.STUDENTS_LIST(schoolId), {
      params: { page, limit, ...filters },
    });
    return response.data;
  },

  get: async (id: string): Promise<StudentProfile> => {
    const response = await client.get(API_ENDPOINTS.STUDENTS_GET(id));
    return response.data;
  },

  linkParent: async (studentId: string, parentIds: string[]): Promise<StudentProfile> => {
    const response = await client.post(API_ENDPOINTS.STUDENTS_LINK_PARENT(studentId), {
      parentIds,
    });
    return response.data;
  },

  getAcademicSummary: async (studentId: string, schoolId: string, termId?: string) => {
    const res = await client.get<StudentAcademicSummaryResponse>(
      API_ENDPOINTS.GET_ACADEMIC_SUMMARY(studentId),
      { params: { schoolId, ...(termId && { termId }) } },
    );
    return res.data;
  },
 
};

export const parentService = {
  list: async (
    schoolId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<ParentProfile>> => {
    const response = await client.get(API_ENDPOINTS.PARENTS_LIST(schoolId), {
      params: { page, limit },
    });
    return response.data;
  },

  get: async (id: string): Promise<ParentProfile> => {
    const response = await client.get(API_ENDPOINTS.PARENTS_GET(id));
    return response.data;
  },

  search: async (schoolId: string, query: string): Promise<ParentProfile> => {
    const response = await client.get(API_ENDPOINTS.PARENTS_LIST(schoolId), {
      params: { search: query, limit: 10 },
    });
    return response.data.data;
  },
};
