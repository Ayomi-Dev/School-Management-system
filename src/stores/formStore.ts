'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FormStore } from '@/src/types/store';

export const useFormStore = create<FormStore>()(
  persist(
    (set) => ({
      drafts: {},

      saveDraft: (formId: string, data) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [formId]: data,
          },
        }));
      },

      getDraft: (formId: string) => {
        const state = useFormStore.getState();
        return state.drafts[formId] || null;
      },

      clearDraft: (formId: string) => {
        set((state) => {
          const newDrafts = { ...state.drafts };
          delete newDrafts[formId];
          return { drafts: newDrafts };
        });
      },

      clearAllDrafts: () => {
        set({ drafts: {} });
      },
    }),
    {
      name: 'form-storage',
    }
  )
);
