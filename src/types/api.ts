// API Request/Response Types
import { ClassLevel, Gender, Role, TermPeriod, UserStatus } from './types';

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
  startDate: string;
  endDate: string;
  isActive: boolean;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  label: string;
  terms?: Term[]
  isCurrent?: boolean
}

export interface CreateAcademicYearRequest {
  label: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

export type EnrollmentWithDetails = {
  id:          string;
  enrolledAt:  string;
  student: {
    id:            string;
    firstName:     string;
    lastName:      string;
    studentNumber: string;
    status:        string;
  };
  class: {
    id:         string;
    level:      string;
    department: string | null;
    subjects:   { id: string; name: string; code: string | null }[];
  };
  academicYear: {
    id:    string;
    label: string;
    terms: { id: string; period: string }[];
  };
};

// Term Types
export interface Term {
  id: string;
  startDate: string;
  endDate: string;
  academicYearId: string;
  schoolId: string;
  isCurrent?: boolean;
  period: TermPeriod
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
  scores: { totalScore: number}[]
}

export interface CreateSubjectRequest {
  name: string;
  code?: string;
  level: ClassLevel
}

// Parent Types
export interface ParentProfile {
  role: "PARENT";
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
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
export interface AdminProfile{
  role: "ADMIN";
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  user: User
}

export type ReportCardStatus = 'DRAFT' | 'PUBLISHED'; 
 
export interface CompiledCardSummary {
  reportCardId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  status: ReportCardStatus;
  totalScore: number | null;
  average: number | null;
  position: number | null;
  hasTeacherRemark: boolean;
  publishedAt: string | null;
  updatedAt: string;
}
 
export interface PendingStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
}
 
export interface ReportCardListResponse {
  data: {
    compiled: CompiledCardSummary[];
    pending: PendingStudent[];
    meta: {
      termId: string;
      classCount: number;
      compiledCount: number;
      publishedCount: number;
    };
  };
}
 
export interface ScoreEntry {
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  caScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  gradeRemark: string | null;
}
 
export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
}
 
export interface ReportCardDetail {
  reportCard: {
    id: string;
    status: ReportCardStatus;
    totalScore: number | null;
    average: number | null;
    position: number | null;
    classSnapshot: string | null;
    teacherRemark: string | null;
    principalRemark: string | null;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  student: StudentInfo
  scores: ScoreEntry[];
  attendanceSummary: AttendanceSummary;
}

export interface StudentInfo {
  id:            string;
  firstName:     string;
  lastName:      string;
  studentNumber: string;
  gender: string;
  level: ClassLevel
}
 
export interface ScoreRecord {
  id:          string;
  subjectId:   string;
  subject:     { name: string; code: string };
  termId:      string;
  term: {
    id:           string;
    period:       string;
    academicYear: { label: string };
  };
  caScore:      number | null;
  examScore:    number | null;
  totalScore:   number | null;
  grade:        string | null;
  gradeRemark:  string | null;
  isPublished:  boolean;
}
 
export interface AttendanceSummary {
  total:    number;
  present:  number;
  late:     number;
  absent:   number;
  unmarked: number;
  rate:     number; // always a number, 0 when no sessions
}
 
export interface ReportCard {
  id:              string;
  termId:          string;
  academicYearId:  string;
  term:            { id: string; period: string };
  academicYear:    { id: string; label: string };
  status:          'DRAFT' | 'PUBLISHED';
  totalScore:      number | null;
  average:         number | null;
  position:        number | null;
  teacherRemark:   string | null;
  principalRemark: string | null;
  classSnapshot:   string | null;
  publishedAt:     string | null;
}
 
export interface EnrollmentRecord {
  id:          string;
  enrolledAt:  string;
  class:       { level: string };
  academicYear: { label: string };
}
 
export interface StudentAcademicSummaryResponse {
  data: {
    student:     StudentInfo;
    enrollments: EnrollmentRecord[];
    scores:      ScoreRecord[];
    attendance:  AttendanceSummary;
    reportCards: ReportCard[];
  };
}
  
export interface UseStudentAcademicSummaryParams {
  studentId: string;
  schoolId:  string;
  termId?:   string;
}
 

export type UserProfile = StudentProfile | TeacherProfile | ParentProfile | BursarProfile | AdminProfile | null

// API Response wrapper
export function isApiError(data: unknown): data is ApiError {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as Record<string, unknown>).error === 'string'
  );
}
