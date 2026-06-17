import {
  QueryClient,
  DefaultOptions,
  QueryClientConfig,
} from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
    throwOnError: true,
  },
  mutations: {
    retry: 1,
    throwOnError: true,
  },
};

const clientConfig: QueryClientConfig = {
  defaultOptions: queryConfig,
};

export const queryClient = new QueryClient(clientConfig);

// Query key factories for better type safety and organization
export const queryKeys = {
  all: ['query'] as const,
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },
  schools: {
    all: ['schools'] as const,
    lists: () => [...queryKeys.schools.all, 'list'] as const,
    list: (filters?: unknown) => [...queryKeys.schools.lists(), { filters }] as const,
    details: () => [...queryKeys.schools.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.schools.details(), id] as const,
  },
  classes: {
    all: ['classes'] as const,
    lists: () => [...queryKeys.classes.all, 'list'] as const,
    list: (schoolId: string, filters?: unknown) =>
      [...queryKeys.classes.lists(), schoolId, { filters }] as const,
    details: () => [...queryKeys.classes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.classes.details(), id] as const,
  },
  academicYears: {
    all: ['academicYears'] as const,
    lists: () => [...queryKeys.academicYears.all, 'list'] as const,
    list: (schoolId: string, filters?: unknown) =>
      [...queryKeys.academicYears.lists(), schoolId, { filters }] as const,
    details: () => [...queryKeys.academicYears.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.academicYears.details(), id] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (schoolId: string, filters?: unknown) =>
      [...queryKeys.users.lists(), schoolId, { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (schoolId: string, filters?: unknown) =>
      [...queryKeys.students.lists(), schoolId, { filters }] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.students.details(), id] as const,
  },
  teachers: {
    all: ['teachers'] as const,
    lists: () => [...queryKeys.teachers.all, 'list'] as const,
    list: (schoolId: string, filters?: unknown) =>
      [...queryKeys.teachers.lists(), schoolId, { filters }] as const,
    details: () => [...queryKeys.teachers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.teachers.details(), id] as const,
  },
  subjects: {
    all: ['subjects'] as const,
    lists: () => [...queryKeys.subjects.all, 'list'] as const,
    list: (schoolId: string, filters?: unknown) =>
      [...queryKeys.subjects.lists(), schoolId, { filters }] as const,
    details: () => [...queryKeys.subjects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.subjects.details(), id] as const,
  },
  profile: {
    all: ['profile'] as const,
    byRole: (role?: string, userId?: string) =>
      [...queryKeys.profile.all, role, userId] as const,
  },
  enrollments: {
    all: ['enrollments'] as const,
    lists: () => [...queryKeys.enrollments.all, 'list'] as const,
    extract: (studentId: string, academicYearId: string) =>
      [...queryKeys.enrollments.all, studentId, academicYearId] as const,  }
};
