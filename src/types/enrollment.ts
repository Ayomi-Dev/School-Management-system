export interface EnrollmentPromotionYear {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface EnrollmentPromotionClass {
  id: string;
  level: string;
  order: number;
}

export interface EnrollmentPromotionCandidate {
  enrollmentId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  targetEnrollment: {
    classId: string;
    classLevel: string;
  } | null;
}

export interface EnrollmentPromotionResponse {
  academicYears: EnrollmentPromotionYear[];
  classes: EnrollmentPromotionClass[];
  classEnrollmentCounts: Record<string, number>;
  selectedSourceAcademicYearId: string | null;
  selectedTargetAcademicYearId: string | null;
  selectedSourceClassId: string | null;
  candidates: EnrollmentPromotionCandidate[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PromoteStudentsRequest {
  studentIds: string[];
  sourceAcademicYearId: string;
  sourceClassId: string;
  targetAcademicYearId: string;
  targetClassId: string;
}

export interface PromoteStudentsResponse {
  message: string;
  data: Array<{
    id: string;
    studentId: string;
    promotedAt: string;
  }>;
}
