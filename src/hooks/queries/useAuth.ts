'use client';

import { useMutation } from '@tanstack/react-query';
import { authService } from '@/src/services/client/auth';
import { queryKeys, queryClient } from '@/src/lib/queryClient';
import { useAuthStore } from '@/src/stores/authStore';
import { AccountSetupRequest } from '@/src/types/api';
import { useToast } from '../useToast';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/src/config/constants';
import { UserLoginInput } from '@/src/validators/userLoginSchema';

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const candidate = error as Record<string, unknown>;

    if (typeof candidate.error === 'string') return candidate.error;
    if (typeof candidate.message === 'string') return candidate.message;

    const response = candidate.response;
    if (response && typeof response === 'object') {
      const responseData = (response as { data?: unknown }).data;
      if (responseData && typeof responseData === 'object') {
        const responsePayload = responseData as Record<string, unknown>;
        if (typeof responsePayload.error === 'string') return responsePayload.error;
        if (typeof responsePayload.message === 'string') return responsePayload.message;
      }
    }
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

export const useLoginMutation = () => { //this is a mutation because it changes auth state
  const { setUser, setError: setAuthError } = useAuthStore();
  const { success, error: toastError } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: UserLoginInput) => {
      try {
        return await authService.login(data);
      } catch (error) {
        const message = getErrorMessage(error);
        setAuthError(message);
        toastError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if (!data) return;

      // Backend handles token cookies - frontend only stores user
      setUser(data.user);
      success(SUCCESS_MESSAGES.LOGIN_SUCCESS);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  })

  const handleLogin = async (data: UserLoginInput) => {
    await loginMutation.mutateAsync(data);
    return loginMutation.isSuccess;
  };

  return { loginMutation, handleLogin };
};

export const useLogoutMutation = () => {
  const { clearAuth } = useAuthStore();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async () => {
      return await authService.logout(); //clear cookies server-side, but also trigger onSuccess to clear client state regardless of server response
    },

    onSuccess: () => { //clear client state on success, but also on error to ensure user is logged out locally even if server call fails
      clearAuth();
      queryClient.clear();

      success(SUCCESS_MESSAGES.LOGOUT_SUCCESS);
    },

    onError: () => {
      clearAuth();
      queryClient.clear();
      error("Logout failed on server, but you have been signed out locally.");
      // router.replace("/auth/login");
      // router.refresh();
    },
  });
};

export const useRefreshAuthMutation = () => {
  const { setUser } = useAuthStore()
  const { success, error: toastError } = useToast();

  return useMutation({
    mutationFn: async () => {
      const result = await authService.refresh();
      return result;
    },
    onSuccess: (data) => {
      setUser(data.user)
      success(SUCCESS_MESSAGES.SESSION_REFRESHED);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
    onError: (error: any) => {
      const message = error?.error || ERROR_MESSAGES.UNKNOWN_ERROR;
      toastError(message);
    }
  })
}


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
