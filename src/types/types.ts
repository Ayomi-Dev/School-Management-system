// ============================================================
// SHARED TYPES — mirrors Prisma enums / common shapes
// ============================================================

export type Role = "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT" | "PARENT" | "BURSAR";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";
export type TokenType = "REFRESH" | "SET_UP" | "VERIFICATION" | "PASSWORD_RESET";
export type TermPeriod = "FIRST" | "SECOND" | "THIRD";
export type ClassLevel =
  | "CRECHE" | "NURSERY1" | "NURSERY2"
  | "PRIMARY1" | "PRIMARY2" | "PRIMARY3" | "PRIMARY4" | "PRIMARY5" | "PRIMARY6"
  | "JSS1" | "JSS2" | "JSS3"
  | "SS1" | "SS2" | "SS3";
export type Department = "ART" | "COMMERCIAL" | "SCIENCE";
export type Gender = "MALE" | "FEMALE";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "UNMARKED";
export type StudentStatus = "ACTIVE" | "GRADUATED" | "TRANSFERRED" | "SUSPENDED" | "WITHDRAWN";
export type ReportCardStatus = "DRAFT" | "PUBLISHED";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "POS" | "ONLINE";
export type Relationship = "MOTHER" | "FATHER" | "GUARDIAN";
export type EmployeeType = "FULL_TIME" | "PART_TIME";

// ---- Pagination ----
export interface PaginationMeta {
  role?:string;
  search?: string;
  page?: number;
  limit?: number;
  total?: number;
  // totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ---- Generic service result ----
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode: number };

  
export interface TeacherListItem {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department?: string | null;
}
 
export interface TeachersListParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
}
 
export interface TeachersListResponse {
  data: {
    data:TeacherListItem[]
  }
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
export interface ScoreRosterEntry {
  scoreId: string | null;
  studentId: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  caScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  gradeRemark: string | null;
  isPublished: boolean;
}
 
export interface ScoreRosterResponse {
  termId: string;
  termLabel: string;
  assessmentConfig: { caMaxScore: number; examMaxScore: number };
  roster: ScoreRosterEntry[];
}
 
export type ScoreField = 'caScore' | 'examScore';
 
export interface SaveScoresPayload {
  field: ScoreField;
  entries: { studentId: string; value: number }[];
}
 
export interface ScoreHistoryEntry {
  id: string;
  caScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  gradeRemark: string | null;
  isPublished: boolean;
  updatedAt: string;
  term: { id: string; period: TermPeriod };
  student: { id: string; firstName: string; lastName: string; studentNumber: string };
}
 
export interface ScoreHistoryParams {
  subjectId: string;
  classId: string;
  page?: number;
  limit?: number;
}
