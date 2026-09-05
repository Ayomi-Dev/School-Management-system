'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthStore } from '@/src/types/store';
import { User } from '@/src/types/api';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      setUser: (user: User) => {
        set({ user });
      },

      // Tokens are managed by httpOnly cookies - no need to store them
      setTokens: () => {
        // Cookies are set by backend on login response
        // Frontend doesn't need to store them
      },

      clearAuth: () => {
        set({
          user: null,
          error: null,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      logout: () => {
        set({
          user: null,
          error: null,
          isLoading: false,
        });
        // Dispatch logout event for other listeners
        window.dispatchEvent(new CustomEvent('auth:logout'));
      },
    }),
    
  )
);
