'use client';

import { useMutation } from '@tanstack/react-query';
import { authService } from '@/src/services/client/auth';
import { queryKeys, queryClient } from '@/src/lib/queryClient';
import { useAuthStore } from '@/src/stores/authStore';
import { AccountSetupRequest } from '@/src/types/api';
import { useToast } from '../useToast';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/src/config/constants';
import { UserLoginInput } from '@/src/validators/userLoginSchema';

export const useLoginMutation = () => { //this is a mutation because it changes auth state
  const { setUser, setError: setAuthError } = useAuthStore();
  const { success, error: toastError } = useToast();

  return useMutation({
    mutationFn: async (credentials: UserLoginInput) => {
      const result = await authService.login(credentials);
      return result;
    },
    onSuccess: (data) => {
      // Backend handles token cookies - frontend only stores user
      setUser(data.user);
      success(SUCCESS_MESSAGES.LOGIN_SUCCESS);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
    onError: (error: any) => {
      const message = error?.error || ERROR_MESSAGES.UNKNOWN_ERROR;
      setAuthError(message);
      toastError(message);
    },
  });
};

export const useLogoutMutation = () => {
  const { clearAuth } = useAuthStore();
  const { success } = useToast();

  return useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      success(SUCCESS_MESSAGES.LOGOUT_SUCCESS);
    },
  });
};

export const useAccountSetupMutation = () => {
  const { success, error: toastError } = useToast();

  return useMutation({
    mutationFn: async (data: AccountSetupRequest) => {
      await authService.accountSetup(data);
    },
    onSuccess: () => {
      success(SUCCESS_MESSAGES.ACCOUNT_SETUP);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
    onError: (error: any) => {
      toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
    },
  });
};

export const useForgotPasswordMutation = () => {
  const { success, error: toastError } = useToast();

  return useMutation({
    mutationFn: async (email: string) => {
      await authService.forgotPassword(email);
    },
    onSuccess: () => {
      success('Password reset link sent to your email');
    },
    onError: (error: any) => {
      toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
    },
  });
};

export const useResetPasswordMutation = () => {
  const { success, error: toastError } = useToast();

  return useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      await authService.resetPassword(data.token, data.newPassword);
    },
    onSuccess: () => {
      success(SUCCESS_MESSAGES.PASSWORD_CHANGED);
    },
    onError: (error: any) => {
      toastError(error?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
    },
  });
};
