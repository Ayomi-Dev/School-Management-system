// ─── Linked students (dashboard) ──────────────────────────────────────────────

export interface LinkedStudent {
  studentId:     string;   // StudentProfile.id
  userId:        string;   // User.id — used for navigation
  firstName:     string;
  lastName:      string;
  studentNumber: string;
  gender:        string;
  dateOfBirth:   string | null;
  currentClass: {
    id:    string;
    level: string;
  } | null;
  school: {
    id:   string;
    name: string;
  };
  currentTerm: {
    id:     string;
    period: string;
    academicYear: { label: string };
  } | null;
  // Snapshot numbers shown on the dashboard card
  snapshot: {
    attendanceRate:    number;
    publishedCards:    number;
    totalSubjects:     number;
  };
}

// ─── Student academic summary (parent view) ────────────────────────────────────
// Parents only receive PUBLISHED scores (isPublished: true) and
// PUBLISHED report cards — drafts are never leaked to parents.

export interface ParentScoreRecord {
  subjectId:   string;
  subjectName: string;
  subjectCode: string;
  termId:      string;
  term: {
    id:           string;
    period:       string;
    academicYear: { label: string };
  };
  caScore:     number | null;
  examScore:   number | null;
  totalScore:  number | null;
  grade:       string | null;
  gradeRemark: string | null;
}

export interface ParentAttendanceSummary {
  total:    number;
  present:  number;
  late:     number;
  absent:   number;
  unmarked: number;
  rate:     number;
}

export interface ParentReportCardSummary {
  id:              string;
  termId:          string;
  term:            { id: string; period: string };
  academicYear:    { id: string; label: string };
  totalScore:      number | null;
  average:         number | null;
  position:        number | null;
  teacherRemark:   string | null;
  principalRemark: string | null;
  publishedAt:     string;
}

export interface ParentStudentSummary {
  student: {
    id:            string;   // StudentProfile.id
    userId:        string;
    firstName:     string;
    lastName:      string;
    studentNumber: string;
    gender:        string;
    currentClass:  { id: string; level: string } | null;
    school:        { name: string };
  };
  enrollments: Array<{
    id:          string;
    enrolledAt:  string;
    class:       { level: string };
    academicYear: { label: string };
  }>;
  scores:      ParentScoreRecord[];
  attendance:  ParentAttendanceSummary;
  reportCards: ParentReportCardSummary[];
}

// ─── Single report card (parent view) ─────────────────────────────────────────
// Read-only. Only returned when status === 'PUBLISHED'.

export interface ParentReportCard {
  reportCard: {
    id:              string;
    totalScore:      number | null;
    average:         number | null;
    position:        number | null;
    teacherRemark:   string | null;
    principalRemark: string | null;
    publishedAt:     string;
    classLevel:      string | null;
    term: {
      period:       string;
      academicYear: string;
    };
  };
  student: {
    firstName:     string;
    lastName:      string;
    studentNumber: string;
    gender:        string;
  };
  scores: Array<{
    subjectId:   string;
    subjectName: string;
    subjectCode: string;
    caScore:     number | null;
    examScore:   number | null;
    totalScore:  number | null;
    grade:       string | null;
    gradeRemark: string | null;
  }>;
  attendanceSummary: {
    total:   number;
    present: number;
    absent:  number;
    late:    number;
  };
}