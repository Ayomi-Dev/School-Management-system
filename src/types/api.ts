// API Request/Response Types
import { z } from 'zod';
import { Gender, Role, UserStatus } from './types';

// Pagination
// export interface PaginatedResponse<T> {
//   data: T[];
//   pagination: {
//     page: number;
//     limit: number;
//     total: number;
//     pages: number;
//   };
// }

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
  statusCode?: number;
}


export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AccountSetupRequest {
  oldPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// User Types


export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userCode: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  schoolId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  classId?: string; // for students
  parentIds?: string[]; // for students
  teacherId?: string; // linking parent
  employmentType?: string; // for teachers
}

// School Types
export interface School {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  foundedYear?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchoolRequest {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  foundedYear?: number;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPhone?: string;
}

// Class Types
export interface Class {
  id: string;
  level: string;
  classTeacherId: string;
  classTeacher?: User;
  academicYearId: string;
  schoolId: string;
  capacity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassRequest {
  level: string;
  department?: string
}

// Academic Year Types
export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAcademicYearRequest {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

// Term Types
export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  academicYearId: string;
  schoolId: string;
}

export interface CreateTermRequest {
  name: string;
  startDate: string;
  endDate: string;
  academicYearId: string;
}

// Student Types
export interface StudentProfile {
  role: "STUDENT";
  id: string;
  userId: string;
  user?: User;
  studentNumber: string;
  phone: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  guardian: ParentProfile
  gender?: Gender;
  classId?: string;
  level: string;
  schoolId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'WITHDRAWN';
  createdAt: string;
  updatedAt: string;
}

// Teacher Types
export interface TeacherProfile {
  role: "TEACHER";
  id: string;
  userId: string;
  user?: User;
  employeeId?: string;
  subjects?: Subject[];
  classes?: Class[];
  qualifications?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

// Subject Types
export interface Subject {
  id: string;
  name: string;
  code?: string;
  teacher?: TeacherProfile;
  class?: Class;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectRequest {
  name: string;
  code?: string;
  description?: string;
}

// Parent Types
export interface ParentProfile {
  role: "PARENT";
  id: string;
  userId: string;
  user?: User;
  relationship?: string;
  occupation?: string;
  address?: string;
  students?: StudentProfile[];
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}
export interface BursarProfile{
  role: "BURSAR";
  id: string;
  userId: string;
  user: User;
}

export type UserProfile = StudentProfile | TeacherProfile | ParentProfile | BursarProfile | null

// API Response wrapper
export function isApiError(data: unknown): data is ApiError {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as Record<string, unknown>).error === 'string'
  );
}
