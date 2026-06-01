import { getApiClient } from '@/src/config/api';
import { API_ENDPOINTS } from '@/src/config/constants';
import {
  LoginResponse,
  AccountSetupRequest,
  RefreshTokenRequest,
} from '@/src/types/api';
import { UserLoginInput } from '@/src/validators/userLoginSchema';

const client = getApiClient();

export const authService = {
  login: async (data: UserLoginInput): Promise<LoginResponse> => {
    const response = await client.post(API_ENDPOINTS.AUTH_LOGIN, data);
    return response.data;
  },

  superAdminLogin: async (data: UserLoginInput): Promise<LoginResponse> => {
    const response = await client.post(API_ENDPOINTS.AUTH_SUPER_ADMIN_LOGIN, data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await client.post(API_ENDPOINTS.AUTH_LOGOUT);
  },

  refresh: async (): Promise<LoginResponse> => {
    const response = await client.post(API_ENDPOINTS.AUTH_REFRESH, {} as RefreshTokenRequest);
    return response.data;
  },

  accountSetup: async (data: AccountSetupRequest): Promise<void> => {
    await client.post(API_ENDPOINTS.AUTH_ACCOUNT_SETUP, data);
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await client.post(API_ENDPOINTS.AUTH_FORGOT_PASSWORD, {
      email,
    });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await client.post(API_ENDPOINTS.AUTH_RESET_PASSWORD, {
      token,
      newPassword,
    });
  },
};
