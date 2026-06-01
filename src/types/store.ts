import { User } from './index';

// Auth Store Types
export interface AuthStoreState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  // Tokens are managed via httpOnly cookies - not stored in store
}

export interface AuthStoreActions {
  setUser: (user: User) => void;
  setTokens: () => void; // Tokens managed by backend cookies
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export type AuthStore = AuthStoreState & AuthStoreActions;

// UI Store Types
export interface UIModalState {
  [modalId: string]: boolean;
}

export interface UIFilterState {
  [filterKey: string]: unknown;
}

export interface UIStoreState {
  modals: UIModalState;
  filters: UIFilterState;
  notifications: any[];
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface UIStoreActions {
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  setFilter: (key: string, value: unknown) => void;
  clearFilters: () => void;
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

export type UIStore = UIStoreState & UIStoreActions;

// Form Store Types
export interface FormDraft {
  [key: string]: unknown;
}

export interface FormStoreState {
  drafts: {
    [formId: string]: FormDraft;
  };
}

export interface FormStoreActions {
  saveDraft: (formId: string, data: FormDraft) => void;
  getDraft: (formId: string) => FormDraft | null;
  clearDraft: (formId: string) => void;
  clearAllDrafts: () => void;
}

export type FormStore = FormStoreState & FormStoreActions;
