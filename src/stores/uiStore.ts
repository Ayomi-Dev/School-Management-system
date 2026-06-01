'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UIStore, UIModalState, UIFilterState } from '@/src/types/store';
import { ToastProps } from '@/src/types/ui';

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      modals: {},
      filters: {},
      notifications: [],
      sidebarCollapsed: false,
      theme: 'auto',

      openModal: (modalId: string) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [modalId]: true,
          },
        }));
      },

      closeModal: (modalId: string) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [modalId]: false,
          },
        }));
      },

      toggleModal: (modalId: string) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [modalId]: !state.modals[modalId],
          },
        }));
      },

      setFilter: (key: string, value: unknown) => {
        set((state) => ({
          filters: {
            ...state.filters,
            [key]: value,
          },
        }));
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      addNotification: (notification: ToastProps) => {
        set((state) => ({
          notifications: [...state.notifications, notification],
        }));

        // Auto-remove after duration
        if (notification.duration !== 0) {
          setTimeout(() => {
            useUIStore.getState().removeNotification(notification.id);
          }, notification.duration || 5000);
        }
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      toggleSidebar: () => {
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        }));
      },

      setTheme: (theme: 'light' | 'dark' | 'auto') => {
        set({ theme });
        if (theme !== 'auto') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
