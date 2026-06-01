'use client';

import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL, API_CONFIG, ERROR_MESSAGES } from '@/src/config/constants';
import { ApiError, isApiError } from '@/src/types/api';

let apiClient: AxiosInstance | null = null;

// api.ts

const AUTH_ROUTES_SKIP_REFRESH = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
];

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    ...API_CONFIG,
    withCredentials: true,
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      const isAuthRoute = AUTH_ROUTES_SKIP_REFRESH.some((route) =>
        originalRequest?.url?.includes(route)
      );

      // Only attempt refresh for protected routes, never for auth routes themselves
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !isAuthRoute                      // ← the critical guard
      ) {
        originalRequest._retry = true;

        try {
          await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            {},
            { withCredentials: true }
          );
          return client(originalRequest);
        } catch (refreshError) {
          window.dispatchEvent(new CustomEvent('auth:logout'));
          window.location.href = '/auth/login';
          return Promise.reject(refreshError);
        }
      }

      // Format error response
      const apiError: ApiError = {
        error: ERROR_MESSAGES.UNKNOWN_ERROR,
        statusCode: error.response?.status,
      };

      if (error.response?.data && isApiError(error.response.data)) {
        apiError.error = (error.response.data as ApiError).error;
        apiError.details = (error.response.data as ApiError).details;
      } else if (error.message === 'Network Error') {
        apiError.error = ERROR_MESSAGES.NETWORK_ERROR;
      } else if (error.response?.status === 400) {
        apiError.error = ERROR_MESSAGES.VALIDATION_ERROR;
      } else if (error.response?.status === 401) {
        apiError.error = ERROR_MESSAGES.UNAUTHORIZED;
      } else if (error.response?.status === 403) {
        apiError.error = ERROR_MESSAGES.FORBIDDEN;
      } else if (error.response?.status === 404) {
        apiError.error = ERROR_MESSAGES.NOT_FOUND;
      } else if (error.response?.status === 500) {
        apiError.error = ERROR_MESSAGES.SERVER_ERROR;
      }

      return Promise.reject(apiError);
    }
  );

  return client;
}

export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    apiClient = createApiClient();
  }
  return apiClient;
}

// Reset client (useful after logout)
export function resetApiClient() {
  apiClient = null;
}
