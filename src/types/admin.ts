import { StudentInfo } from "./api";
import { ClassLevel, Relationship } from "./types";

export interface ScoreSheet {
  term: string;
  year: string;
  subjects: string[];
  rows: Array<{
    studentId: string;
    studentName: string;
    studentNumber?: string;
    scores: Record<
      string,
      { ca: number; exam: number; total: number; grade: string }
    >;
  }>;
}
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
export type UserRole = 'STUDENT' | 'TEACHER' | 'PARENT' | 'BURSAR' | 'ADMIN'
export interface PublishReportCardResponse {
  message: string;
  data: {
    id: string;
    status: 'PUBLISHED';
    publishedAt: string;
  };
}

 
export interface UpdateUserStatusBody {
  status: UserStatus;
}
 
export interface UpdateUserStatusResponse {
  message: string;
  data: {
    id: string;
    status: UserStatus;
  };
}
 

export interface ClassDetail {
  id: string;
  level: string;
  order: number;
  department?: string;
  teacherAssignment?: {
    teacher: {
      id: string;
      user: { id: string; firstName: string; lastName: string; email: string };
    };
  };
  subjects: Array<{ id: string; name: string; code?: string }>;
  enrollments: Array<{
    id: string;
    student: {
      id: string;
      studentNumber?: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        status: string;
      };
    };
  }>;
  _count: { enrollments: number; subjects: number };
}
export interface UserProfile {
  data:{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    studentProfile?: {
      id: string;
      studentNumber?: string;
      dateOfBirth?: string;
      level?:ClassLevel
      guardian: { id: string; firstName: string; lastName: string; phone: string } | null
    };
    teacherProfile?: {
      id: string;
      employeeNumber?: string;
      qualification?: string;
      classAssignment?: { id: string; level: string;}
    };
    guardianProfile?: {
      id: string;
      relationship: Relationship
      students: StudentInfo[]
    };

  }
}

export interface ReportCardDetail {
  id: string;
  status: 'DRAFT' | 'PUBLISHED';
  totalScore: number | null;
  average: number | null;
  position: number | null;
  classSnapshot: string | null;
  teacherRemark: string | null;
  principalRemark: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  term: {
    id: string;
    period: string;
    academicYear: string;
  };
  classLevel: string | null;
}
 
export interface ReportCardStudent {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  gender: string;
}
 
export interface ReportCardScoreRow {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  caScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  gradeRemark: string | null;
}
 
export interface ReportCardAttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
}
 
export interface ReportCardFullDetail {
  reportCard: ReportCardDetail;
  student: ReportCardStudent;
  scores: ReportCardScoreRow[];
  attendanceSummary: ReportCardAttendanceSummary;
}
 
// ─── Update report card (admin) ────────────────────────────────────────────────
 
export interface UpdateReportCardBody {
  teacherRemark?: string;
  principalRemark?: string;
}
 
export interface UpdateReportCardResponse {
  message: string;
  data: {
    id: string;
    teacherRemark: string | null;
    principalRemark: string | null;
    status: 'DRAFT' | 'PUBLISHED';
  };
}

export interface UnpublishReportCardResponse {
  message: string;
  data: {
    id: string;
    status: 'DRAFT';
    publishedAt: null;
  };
}

export interface LinkStudentToParentBody {
  parentUserId: string;
}
 
export interface LinkStudentToParentResponse {
  message: string;
  data: {
    studentId:   string;
    guardianId:  string;
    wasExisting: boolean;
  };
}
 
export interface ParentListItem {
  id: string;           // User.id
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  guardianId: string | null;   // null if no Guardian record yet
  linkedCount: number;          // how many students already linked
}
 