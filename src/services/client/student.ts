import { getApiClient } from '@/src/config/api';
import { API_ENDPOINTS } from '@/src/config/constants';
import { PaginatedResponse } from '@/src/types';
import { Student, Parent } from '@/src/types/api';

const client = getApiClient();

export const studentService = {
  list: async (
    schoolId: string,
    page = 1,
    limit = 20,
    filters?: { classId?: string; level?: string; search?: string }
  ): Promise<PaginatedResponse<Student>> => {
    const response = await client.get(API_ENDPOINTS.STUDENTS_LIST(schoolId), {
      params: { page, limit, ...filters },
    });
    return response.data;
  },

  get: async (id: string): Promise<Student> => {
    const response = await client.get(API_ENDPOINTS.STUDENTS_GET(id));
    return response.data;
  },

  linkParent: async (studentId: string, parentIds: string[]): Promise<Student> => {
    const response = await client.post(API_ENDPOINTS.STUDENTS_LINK_PARENT(studentId), {
      parentIds,
    });
    return response.data;
  },
};

export const parentService = {
  list: async (
    schoolId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Parent>> => {
    const response = await client.get(API_ENDPOINTS.PARENTS_LIST(schoolId), {
      params: { page, limit },
    });
    return response.data;
  },

  get: async (id: string): Promise<Parent> => {
    const response = await client.get(API_ENDPOINTS.PARENTS_GET(id));
    return response.data;
  },

  search: async (schoolId: string, query: string): Promise<Parent[]> => {
    const response = await client.get(API_ENDPOINTS.PARENTS_LIST(schoolId), {
      params: { search: query, limit: 10 },
    });
    return response.data.data;
  },
};
