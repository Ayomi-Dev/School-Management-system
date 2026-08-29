import { getApiClient } from '@/src/config/api';
import { API_ENDPOINTS } from '@/src/config/constants';
import { CreateSchoolRequest, School } from '@/src/types/api';
import { PaginatedResponse} from '@/src/types/types';
import { CreatSchoolRequest } from '@/src/validators/schoolSchema';

const client = getApiClient();

export const schoolService = {
  list: async (page = 1, limit = 20): Promise<PaginatedResponse<School>> => {
    const response = await client.get(API_ENDPOINTS.SCHOOLS_LIST, {
      params: { page, limit },
    });
    return response.data;
  },

  create: async (data: CreateSchoolRequest): Promise<School> => {
    const response = await client.post(API_ENDPOINTS.SCHOOLS_CREATE, data);
    return response.data;
  },

  get: async (id: string): Promise<School> => {
    const response = await client.get(API_ENDPOINTS.SCHOOLS_GET(id));
    return response.data;
  },

  update: async (id: string, data: Partial<CreateSchoolRequest>): Promise<School> => {
    const response = await client.post(API_ENDPOINTS.SCHOOLS_UPDATE(id), data);
    return response.data;
  },

  createAdmin: async (
    schoolId: string,
    data: {
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      password?: string;
    }
  ) => {
    const response = await client.post(API_ENDPOINTS.SCHOOLS_CREATE_ADMIN(schoolId), data);
    return response.data;
  },
};
