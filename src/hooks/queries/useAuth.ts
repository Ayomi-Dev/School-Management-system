'use client';

import { useMutation } from '@tanstack/react-query';
import { authService } from '@/src/services/client/auth';
import { queryKeys, queryClient } from '@/src/lib/queryClient';
import { useAuthStore } from '@/src/stores/authStore';
import { AccountSetupRequest } from '@/src/types/api';
import { useToast } from '../useToast';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/src/config/constants';
import { UserLoginInput } from '@/src/validators/userLoginSchema';
import { getErrorMessage } from '@/src/utils/error';



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
  const { clearAuth, setError: setLogoutError } = useAuthStore();
  const { success, error: toastError} = useToast();

  return useMutation({
    mutationFn: async () => {
      try {
        return await authService.logout();
      } catch (error) {
        const message = getErrorMessage(error); //clear cookies server-side, but also trigger onSuccess to clear client state regardless of server response
        setLogoutError(message);
        toastError(message);
        return null;
      }
    },

    onSuccess: () => { //clear client state on success, but also on error to ensure user is logged out locally even if server call fails
      clearAuth();
      queryClient.clear();

      success(SUCCESS_MESSAGES.LOGOUT_SUCCESS);
    },
  });
};

export const useRefreshAuthMutation = () => {
  const { setUser, setError: setAuthError } = useAuthStore()
  const { success, error: toastError } = useToast();

  return useMutation({
    mutationFn: async () => {
      try {
        return await authService.refresh()
      } catch (error) {
        const message = getErrorMessage(error);
        setAuthError(message);
        toastError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if (!data) return;
      setUser(data.user)
      success(SUCCESS_MESSAGES.SESSION_REFRESHED);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  })
}

export const useAccountSetupMutation = () => {
  const { success, error: toastError } = useToast();
  const { setError: setAuthError } = useAuthStore()

  return useMutation({
    mutationFn: async (data: AccountSetupRequest) => {
      try {
        return await authService.accountSetup(data)
      } catch (error) {
        const message = getErrorMessage(error);
        setAuthError(message);
        toastError(message);
        return null;
      }    },
    onSuccess: () => {
      success(SUCCESS_MESSAGES.ACCOUNT_SETUP);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
};

export const useForgotPasswordMutation = () => {
  const { success, error: toastError } = useToast();
  const { setError: setForgotPasswordError } = useAuthStore()

  return useMutation({
    mutationFn: async (email: string) => {
      try {
        return await authService.forgotPassword(email)
      } catch (error) {
        const message = getErrorMessage(error);
        setForgotPasswordError(message);
        toastError(message);
        return null;
      }
    },
    onSuccess: (email) => {
      if(!email) return;
      success('Password reset link sent to your email');
    },
  });
};

export const useResetPasswordMutation = () => {
  const { success, error: toastError } = useToast();
  const { setError: setResetPasswordError } = useAuthStore()

  return useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      try {
        return await authService.resetPassword(data.token, data.newPassword)
      } catch (error) {
        const message = getErrorMessage(error);
        setResetPasswordError(message);
        toastError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if(!data) return;
      success(SUCCESS_MESSAGES.PASSWORD_CHANGED);
    },
  });
};
