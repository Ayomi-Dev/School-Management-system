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
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ---- Generic service result ----
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode: number };