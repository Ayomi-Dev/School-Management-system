import { getApiClient } from '@/src/config/api';
import { API_ENDPOINTS } from '@/src/config/constants';
import { PaginatedResponse } from '@/src/types';
import { User, CreateUserRequest, } from '@/src/types/api';

const client = getApiClient();

export const userService = {
  list: async (
    schoolId: string,
    page = 1,
    limit = 20,
    filters?: { role?: string; search?: string }
  ): Promise<PaginatedResponse<User>> => {
    const response = await client.get(API_ENDPOINTS.USERS_LIST, {
      params: { page, limit, ...filters },
    });
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await client.post(API_ENDPOINTS.USERS_CREATE, data);
    return response.data;
  },

  get: async (id: string): Promise<User> => {
    const response = await client.get(API_ENDPOINTS.USERS_GET(id));
    return response.data;
  },

  changePassword: async (
    userId: string,
    data: { currentPassword: string; newPassword: string }
  ): Promise<void> => {
    await client.post(API_ENDPOINTS.USERS_CHANGE_PASSWORD(userId), data);
  },

  search: async (
    schoolId: string,
    query: string,
    role?: string
  ): Promise<User[]> => {
    const response = await client.get(API_ENDPOINTS.USERS_LIST, {
      params: { search: query, role, limit: 10 },
    });
    return response.data.data;
  },
};
