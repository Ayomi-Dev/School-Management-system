'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const { user, isLoading, error, clearAuth } = useAuthStore();
  const router = useRouter();

  // isAuthenticated determined by presence of user (set on login)
  // Actual token is in httpOnly cookie managed by browser
  const isAuthenticated = !!user;

  const logout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    logout,
  };
};

export const useAuthGuard = (redirectTo = '/auth/login') => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  return isAuthenticated;
};

export const useRole = (requiredRoles?: string[]) => {
  const { user } = useAuth();

  if (!user) return false;
  if (!requiredRoles || requiredRoles.length === 0) return true;

  return requiredRoles.includes(user.role);
};
