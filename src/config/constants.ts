// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '' ;

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
  USERS_GET: (id: string) => `/api/admin/users/${id}`,
  USERS_CHANGE_PASSWORD: (id: string) => `/api/users/${id}/change-password`, 
  USERS_UPDATE: (id: string) => `/api/admin/users/${id}`,
  USERS_DELETE: (id: string) => `/api/admin/users/${id}`,
  GET_ADMIN_PROFILE: (id: string) => `/api/admin/${id}/profile`,
  UPDATE_USER_STATUS: (userId: string) => `/api/admin/users/${userId}/status`,
  GET_STUDENT_ACADEMIC_SUMMARY: (id: string) => `/api/admin/students/${id}/academic-summary`,


  // Admin - Classes
  CLASSES_CREATE: '/api/admin/classes/create',
  CLASSES_LIST:  `/api/admin/classes`,
  CLASSES_GET: (classId: string) => `/api/admin/classes/${classId}`,
  CLASSES_UPDATE: (classId: string) => `/api/admin/classes/${classId}`,
  CLASSES_DELETE: (classId: string) => `/api/admin/classes/${classId}`,
  CLASS_SCORESHEET: (classId: string) => `/api/admin/classes/${classId}/score-sheet`,
  PUBLISH_CLASS_REPORT_CARDS: (classId: string) => `/api/admin/classes/${classId}/publish-report-cards`,

  // Admin - Subjects
  SUBJECTS_CREATE: '/api/admin/subjects/create',
  SUBJECTS_LIST: `/api/admin/subjects`,
  SUBJECTS_ASSIGN_TEACHER: '/api/admin/teachers/assign-subjects',
  SUBJECTS_REMOVE_TEACHER: '/api/admin/teachers/remove-subject',

  // Admin - Academic
  ACADEMIC_YEARS_CREATE: '/api/admin/academics',
  ACADEMIC_YEARS_LIST: (schoolId: string) => `/api/admin/academics`,
  TERMS_CREATE: '/api/admin/terms/create',
  TERMS_LIST: (academicYearId: string) => `/api/admin/academic-years/${academicYearId}/terms`,
  ENROLLMENTS_LIST: (schoolId: string ) => `/api/students/${schoolId}/enrollment`,
  GET_STATS: `/api/admin/stats`,
  ADMIN_PUBLISH_REPORT_CARD: (reportCardId: string) =>
    `/api/admin/report-cards/${reportCardId}/publish`,
  ADMIN_UNPUBLISH_REPORT_CARD: (reportCardId: string) =>
    `/api/admin/report-cards/${reportCardId}/unpublish`,
  GET_REPORT_CARD: (reportCardId: string) =>
    `/api/admin/report-cards/${reportCardId}`,
  ADMIN_UPDATE_REPORT_CARD: (reportCardId: string) =>
    `/api/admin/report-cards/${reportCardId}`,

  //Timetable
  /** GET  /admin/classes/:classId/timetable */
  GET_TIMETABLE: (classId: string) =>
    `/api/admin/classes/${classId}/timetable`,
 
  /** GET  /admin/classes/:classId/timetable/teachers */
  GET_CLASS_TEACHERS: (classId: string) =>
    `/api/admin/classes/${classId}/timetable/teachers`,
 
  /** POST /admin/classes/:classId/timetable */
  CREATE_SLOT: (classId: string) =>
    `/api/admin/classes/${classId}/timetable`,
 
  /** PATCH /admin/classes/:classId/timetable/:slotId */
  UPDATE_SLOT: (classId: string, slotId: string) =>
    `/api/admin/classes/${classId}/timetable/${slotId}`,
 
  /** DELETE /admin/classes/:classId/timetable/:slotId */
  DELETE_SLOT: (classId: string, slotId: string) =>
    `/api/admin/classes/${classId}/timetable/${slotId}`,

  //Admin - Students
  ADMIN_GET_ACADEMIC_SUMMARY: (userId: string) =>  `/api/admin/students/${userId}/academic-summary`,

  //Admin - school branding
  /** GET  /admin/school/branding */
  GET_SCHOOL_BRANDING: () => '/api/admin/school/branding',
  /** PATCH /admin/school/branding — body: UpdateSchoolBrandingBody */
  UPDATE_SCHOOL_BRANDING: () => '/admin/school/branding',
  /** POST /admin/school/branding/logo-upload-url */
  GET_LOGO_UPLOAD_URL: () => '/api/admin/school/branding/logo-upload-url',
  
  

  // Students
  STUDENTS_LIST: (schoolId: string) => `/api/admin/schools/${schoolId}/students`,
  STUDENTS_GET: (id: string) => `/api/students/${id}/profile`,
  STUDENTS_LINK_PARENT: (id: string) => `/api/admin/students/${id}/link`,
  EXTRACT_ENROLLMENT: (id: string, academicYearId: string ) => `/api/students/${id}/enrollment?academicYearId=${academicYearId} `,
  GET_ACADEMIC_SUMMARY: (id: string) => `/api/students/${id}/attendance`,

  // Teachers
  TEACHERS_LIST: (schoolId: string) => `/api/admin/schools/${schoolId}/teachers`,
  TEACHERS_GET: (id: string) => `/api/teachers/${id}`,
  TEACHER_GET_MY_CLASS: ( ) => `/api/teachers/class`,
  GET_DAILY_ROSTER: (classId: string) => `/api/teachers/class/${classId}/attendance`,
  MARK_ATTENDANCE: (classId: string) => `/api/teachers/class/${classId}/attendance`,
  GET_ATTENDANCE_HISTORY: (classId: string) => `api/teachers/class/${classId}/attendance/history`,
  SAVE_SCORES: (classId: string, subjectId: string) => `/api/teachers/class/${classId}/subjects/${subjectId}/scores`,
  GET_SCORE_HISTORY: (classId: string, subjectId: string) => `/api/teachers/class/${classId}/subjects/${subjectId}/scores/history`,
  GET_SCORE_ROSTER: (classId: string, subjectId: string) => `/api/teachers/class/${classId}/subjects/${subjectId}/scores`,
  GET_MY_SUBJECTS: ( classId: string) => `/api/teachers/class/${classId}/subjects`,
  ASSIGN_TEACHER_TO_CLASS: `/api/admin/teachers/assign-class`,
  GET_MY_STUDENTS: (classId: string) => `/api/teachers/class/${classId}/students`,
  GET_SCORE_SHEET: (classId: string) => `/api/teachers/class/${classId}/scores/sheet`,
  GET_SUBJECT_ASSIGNMENTS: `/api/teachers/me/subject-assignments`,
  GET_OVERVIEW: `/api/teachers/me/overview`,

  //Report cards
  COMPILE_REPORT_CARDS: (classId: string) => `/api/teachers/class/${classId}/report-cards/compile`,
  GET_REPORT_CARDS: (classId: string) => `/api/teachers/class/${classId}/report-cards`,
  GET_SINGLE_REPORT_CARD: (classId: string, reportCardId: string) => `/api/teachers/class/${classId}/report-cards/${reportCardId}`,
  UPDATE_REPORT_CARD : (classId: string, reportCardId: string) => `/api/teachers/class/${classId}/report-cards/${reportCardId}`,


  // Parents
  PARENTS_LIST: (schoolId: string) => `/api/admin/schools/${schoolId}/parents`,
  PARENTS_GET: (id: string) => `/api/parents/${id}`,
  GET_PARENTS_LIST: () => `/api/admin/parents`,
  LINK_STUDENT_TO_PARENT: (studentId: string) => `/api/admin/students/${studentId}/link`,
  GET_LINKED_STUDENTS: () => '/api/parents/students',
  GET_STUDENT_SUMMARY: (studentId: string) => `/api/parents/students/${studentId}/summary`,
  GET_STUDENT_REPORT_CARD: (reportCardId: string) => `/api/parents/students/report-card/${reportCardId}`,

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
