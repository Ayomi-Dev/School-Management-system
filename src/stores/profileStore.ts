// stores/profileStore.ts
import { create } from 'zustand';
import { UserProfile } from '../types/api';

type ProfileStore = {
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  profileError: string | null;
  setProfile: (profile: any) => void;
  setProfileLoading: (val: boolean) => void;
  setProfileError: (err: string | null) => void;
  clearProfile: () => void;
};

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  isLoadingProfile: false,
  profileError: null,
  setProfile: (profile) => set({ profile }),
  setProfileLoading: (val) => set({ isLoadingProfile: val }),
  setProfileError: (err) => set({ profileError: err }),
  clearProfile: () => set({ profile: null, profileError: null }),
}));