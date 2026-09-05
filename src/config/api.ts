'use client';

import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG, API_ENDPOINTS, ERROR_MESSAGES, getApiBaseUrl } from '@/src/config/constants';
import { ApiError, isApiError } from '@/src/types/api';

let apiClient: AxiosInstance | null = null;

// api.ts

const AUTH_ROUTES_SKIP_REFRESH = [
  API_ENDPOINTS.AUTH_LOGIN,
  API_ENDPOINTS.AUTH_SUPER_ADMIN_LOGIN,
  API_ENDPOINTS.AUTH_LOGOUT,
  API_ENDPOINTS.AUTH_REFRESH,
  API_ENDPOINTS.AUTH_ACCOUNT_SETUP,
  API_ENDPOINTS.AUTH_FORGOT_PASSWORD,
  API_ENDPOINTS.AUTH_RESET_PASSWORD,
];

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getApiBaseUrl(),
    ...API_CONFIG,
    withCredentials: true,
  });

  // ── Request interceptor — re-derive baseURL on every request ──
  // This is the critical guard: even if the client was created with
  // a stale baseURL, every outgoing request corrects it at send time.
  client.interceptors.request.use((config) => {
    // Re-derive base URL at actual request time (not client creation time)
    // This handles edge cases where the module was loaded server-side
    // but the request fires client-side.
    if (typeof window !== "undefined") {
      config.baseURL = window.location.origin;
    }

    console.log(
      "[apiClient] →",
      config.method?.toUpperCase(),
      `${config.baseURL}${config.url}`
    );

    return config;
  });


  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest =  error.config as typeof error.config & {
        _retry?: boolean;
      };

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
          // Use window.location.origin directly — never a stale constant
          await axios.post(
            `${typeof window !== "undefined" ? window.location.origin : ""}/api/auth/refresh`,
            {},
            { withCredentials: true }
          );

          return client(originalRequest);
        } catch (refreshError) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("auth:logout"));
            window.location.href = "/auth/login";
          }
          return Promise.reject(refreshError);
        }
      }

      // Format error response
      const status = error.response?.status;
      const serverData = error.response?.data;
      const apiError: ApiError = {
        error: isApiError(serverData) ? (serverData as ApiError).error : error.message === "Network Error"
          ? ERROR_MESSAGES.NETWORK_ERROR
          : status === 400 ? ERROR_MESSAGES.VALIDATION_ERROR
          : status === 401 ? ERROR_MESSAGES.UNAUTHORIZED
          : status === 403 ? ERROR_MESSAGES.FORBIDDEN
          : status === 404 ? ERROR_MESSAGES.NOT_FOUND
          : status === 500 ? ERROR_MESSAGES.SERVER_ERROR
          : ERROR_MESSAGES.UNKNOWN_ERROR,
        statusCode: status,
        details: isApiError(serverData) ? (serverData as ApiError).details : undefined,
      };
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
