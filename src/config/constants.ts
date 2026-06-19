// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_SUPER_ADMIN_LOGIN: '/api/auth/super-admin/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_REFRESH: '/api/auth/refresh',
  AUTH_ACCOUNT_SETUP: '/api/auth/account-setup',
  AUTH_FORGOT_PASSWORD: '/api/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/api/auth/reset-password',

  // Super Admin
  SCHOOLS_LIST: '/api/super-admin/schools',
  SCHOOLS_CREATE: '/api/super-admin/create-school',
  SCHOOLS_GET: (id: string) => `/api/super-admin/schools/${id}`,
  SCHOOLS_UPDATE: (id: string) => `/api/super-admin/schools/${id}`,
  SCHOOLS_CREATE_ADMIN: (id: string) => `/api/super-admin/schools/${id}/admin`,

  // Admin - Users
  USERS_CREATE: '/api/admin/create-user',
  USERS_LIST: `/api/admin/users`,
  USERS_GET: (id: string) => `/api/users/${id}`,
  USERS_CHANGE_PASSWORD: (id: string) => `/api/users/${id}/change-password`, 
  USERS_UPDATE: (id: string) => `api/admin/users/${id}`,
  USERS_DELETE: (id: string) => `api/admin/users/${id}`,
  GET_ADMIN_PROFILE: (id: string) => `api/admin/${id}/profile`,

  // Admin - Classes
  CLASSES_CREATE: '/api/admin/classes/create',
  CLASSES_LIST: (schoolId: string) => `/api/admin/schools/${schoolId}/classes`,
  CLASSES_GET: (id: string) => `/api/admin/classes/${id}`,
  CLASSES_UPDATE: (id: string) => `/api/admin/classes/${id}`,

  // Admin - Subjects
  SUBJECTS_CREATE: '/api/admin/subjects/create',
  SUBJECTS_LIST: (schoolId: string) => `/api/admin/schools/${schoolId}/subjects`,
  SUBJECTS_ASSIGN_TEACHER: '/api/admin/teachers/assign-subjects',
  SUBJECTS_REMOVE_TEACHER: '/api/admin/teachers/remove-subject',

  // Admin - Academic
  ACADEMIC_YEARS_CREATE: '/api/admin/academic-years/create',
  ACADEMIC_YEARS_LIST: (schoolId: string) => `/api/admin/academics`,
  TERMS_CREATE: '/api/admin/terms/create',
  TERMS_LIST: (academicYearId: string) => `/api/admin/academic-years/${academicYearId}/terms`,
  ENROLLMENTS_LIST: (schoolId: string ) => `api/students/${schoolId}/enrollment`,


  // Students
  STUDENTS_LIST: (schoolId: string) => `/api/admin/schools/${schoolId}/students`,
  STUDENTS_GET: (id: string) => `/api/students/${id}/profile`,
  STUDENTS_LINK_PARENT: (id: string) => `/api/admin/students/${id}/link`,
  EXTRACT_ENROLLMENT: (id: string, academicYearId: string ) => `api/students/${id}/enrollment?academicYearId=${academicYearId} `,

  // Teachers
  TEACHERS_LIST: (schoolId: string) => `/api/admin/schools/${schoolId}/teachers`,
  TEACHERS_GET: (id: string) => `/api/teachers/${id}`,
  TEACHER_GET_ME: ( ) => `/api/teachers/class`,

  // Parents
  PARENTS_LIST: (schoolId: string) => `/api/admin/schools/${schoolId}/parents`,
  PARENTS_GET: (id: string) => `/api/parents/${id}`,

  //Bursar
  BURSAR_GET: (id: string) => `/api/bursar/${id}`,
} as const;

export const API_CONFIG = {
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Validation Rules
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Unauthorized. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  CREATED_SUCCESS: 'Created successfully.',
  UPDATED_SUCCESS: 'Updated successfully.',
  DELETED_SUCCESS: 'Deleted successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.',
  ACCOUNT_SETUP: 'Account setup completed.',
  SESSION_REFRESHED: 'Session refreshed.',
};

// Toast Duration (ms)
export const TOAST_DURATION = {
  SHORT: 3000,
  NORMAL: 5000,
  LONG: 8000,
};

// Pagination
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
};
