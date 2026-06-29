import { ClassLevel } from "./types";

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
    };
    teacherProfile?: {
      id: string;
      staffId?: string;
      qualification?: string;
      classAssignment?: { id: string; level: string;}
    };

  }
}
 