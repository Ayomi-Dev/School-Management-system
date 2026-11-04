export interface AcademicReportYearOption {
  id: string;
  label: string;
  isCurrent: boolean;
  terms: AcademicReportTermOption[];
}

export interface AcademicReportTermOption {
  id: string;
  period: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
}

export interface AcademicReportClassOption {
  id: string;
  level: string;
}

export interface AcademicReportClassRow {
  id: string;
  className: string;
  totalStudents: number;
  assessedStudents: number;
  averageScore: number | null;
  passRate: number | null;
}

export interface AcademicReportStudentRow {
  id: string;
  studentName: string;
  studentNumber: string;
  classId: string;
  className: string;
  averageScore: number;
  subjectsAttempted: number;
}

export interface AcademicReportResponse {
  academicYears: AcademicReportYearOption[];
  classes: AcademicReportClassOption[];
  selectedAcademicYearId: string | null;
  selectedTermId: string | null;
  selectedClassId: string | null;
  selectedTermLabel: string;
  passThreshold: number;
  summary: {
    totalStudents: number;
    assessedStudents: number;
    averageScore: number | null;
    passRate: number | null;
  };
  classPerformance: AcademicReportClassRow[];
  studentPerformance: AcademicReportStudentRow[];
}
