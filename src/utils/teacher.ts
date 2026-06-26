import { ClassLevel, StudentProfile, TeacherProfile, TermPeriod } from "../types";


export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Represents one class assignment from TeacherClassAssignment.
 * Fetch this from /api/teacher/me/classes and store in Zustand.
 * The selected classId drives all scoped nav hrefs below.
 * 
 */
export interface SubjectAssignmentType {
  id: string;
  assignedAt: string;
  class: {
    level: ClassLevel
  }
  subject: {
    name: string;
    code: string;
  }
  subjectId: string;
  teacherId: string;
}
export interface ClassAssignmentType{
  academicYearId: string;
  class: {
    level: ClassLevel
  }
  classId: string;
  id: string;
  isClassTeacher: boolean;
  teacherId: string;
  assignedAt: string
}

export interface AssignedClass {
  data: {
    teacher: TeacherProfile;
    subjectAssignment: SubjectAssignmentType[];
    classAssignment: ClassAssignmentType
  }
}
export interface AssignClassTeacherPayload {
  teacherEmployeeNumber: string;
  isClassTeacher: boolean;
  academicYearLabel: string;
  level: string;
}

// ─── CLASS SWITCHER ───────────────────────────────────────────────────────────
// Renders a dropdown of all classes the teacher is assigned to.
// On selection, call onSelect(classId) to update the Zustand context slice
// and re-derive all nav hrefs.

export interface ClassSwitcherProps {
  class: AssignedClass;
  selectedClassId: string | null;
  onSelect: (classId: string) => void;
}




export interface TeacherSidebarProps {
  /**
   * All classes this teacher is assigned to — sourced from TeacherClassAssignment.
   * Pass these from the dashboard layout after fetching /api/teacher/me/classes.
   * Store the selected classId in a Zustand slice (e.g. useTeacherContextStore).
   */
  assignedClass: AssignedClass;
}

export interface AssignSubjectTeacherPayload {
  subjectName: string;
  level: string;
  teacherNumber: string;
}
 
export interface AssignSubjectTeacherResponse {
  message: string;
  data: {
    subject: { id: string };
    record: {
      id: string;
      subjectId: string;
      classId: string;
      teacherId: string;
      termId: string;
      assignedAt: string;
    };
  };
}
export interface SelectedTeacher {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  classAssignment: { isClassTeacher: boolean}
}

export interface TeacherComboboxProps {
  value: SelectedTeacher | null;
  onChange: (teacher: SelectedTeacher) => void;
  placeholder?: string;
}

export type AttendanceStatus = 'UNMARKED' | 'PRESENT' | 'ABSENT' | 'LATE';
 
export interface RosterEntry {
  attendanceId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  status: AttendanceStatus;
  remark: string | null;
}
 
export interface DailyRosterResponse {
  session: {
    id: string;
    isCompleted: boolean;
    date: string;
  };
  roster: RosterEntry[];
}
 
export interface MarkAttendanceEntry {
  attendanceId: string;
  status: Exclude<AttendanceStatus, 'UNMARKED'>;
  remark?: string;
}
 
export interface MarkAttendancePayload {
  sessionId: string;
  entries: MarkAttendanceEntry[];
}
 
export interface AttendanceHistoryEntry {
  sessionId: string;
  date: string;
  isCompleted: boolean;
  totalStudents: number;
  counts: { PRESENT: number; ABSENT: number; LATE: number; UNMARKED: number };
}
 
export interface AttendanceHistoryParams {
  classId: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}


export interface MySubjectListEntry {
  subjectId: string;
  name: string;
  code: string | null;
  assignedTeacher: string | null;
  isPersonallyAssigned: boolean;
}
 
export interface MySubjectsResponse {
  data: MySubjectListEntry[];
  meta: { accessLevel: 'class_teacher' | 'subject_teacher' };
}
export  interface MyStudentsResponse {
  data: {
    students: StudentProfile[];
    studentCount: number;
    class: {
      id: string;
      level: ClassLevel;
      department?: string
    };
    academicYear: {
      id: string;
      label: string;
      isCurrent: boolean
    }
  }
}
 
export interface SubjectAssignment {
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
}
 
export interface ClassWithSubjects {
  classId: string;
  className: string;
  subjects: SubjectAssignment[];
}
 
export interface MySubjectAssignmentsResponse {
  data: { classes: ClassWithSubjects[] };
}
 

 //scores
export interface ScoreSheetSubject {
  id: string;
  name: string;
  code: string | null;
}
 
export interface ScoreSheetCell {
  caScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  isPublished: boolean;
}
 
export interface ScoreSheetStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  scores: Record<string, ScoreSheetCell | null>; // keyed by subjectId
}
 
export interface ScoreSheetResponse {
  data: {
    subjects: ScoreSheetSubject[];
    students: ScoreSheetStudent[];
    meta: { termId: string, term: TermPeriod };
  };
}
 

// ─── NAV FACTORY ──────────────────────────────────────────────────────────────
// Nav items are functions of classId so hrefs stay correct when the teacher
// switches context. All class-scoped routes include the classId as a path
// segment so pages can read it via params without needing global state.

export function buildClassNavSections(classId: string): NavSection[] {
  const base = `/dashboard/teacher/classes/${classId}`;

  return [
    {
      title: 'Class Management',
      items: [
        {
          label: 'Overview',
          href: base,
          icon: '🏫',
        },
        {
          label: 'Students',
          href: `${base}/students/list`,
          icon: '👥',
          children: [
            {
              label: 'Student List',
              href: `${base}/students/list`,
              icon: '📋',
            },
            {
              label: 'Student Profiles',
              href: `${base}/students/profiles`,
              icon: '👤',
            },
          ],
        },
        {
          label: 'Attendance',
          href: `${base}/attendance/mark`,
          icon: '✅',
          children: [
            {
              label: 'Mark Attendance',
              href: `${base}/attendance/mark`,
              icon: '📝',
            },
            {
              label: 'Attendance History',
              href: `${base}/attendance/history`,
              icon: '📅',
            },
            {
              label: 'Attendance Report',
              href: `${base}/attendance/report`,
              icon: '📊',
            },
          ],
        },
        {
          label: 'Report Cards',
          href: `#`,
          icon: '🗂️',
          children: [
            {
              label: 'Compile Cards',
              href: `${base}/report-cards/compile`,
              icon: '🔧',
            },
            {
              label: 'Publish',
              href: `${base}/report-cards/publish`,
              icon: '📤',
            },
          ],
        },
        {
          label: 'Timetable',
          href: `${base}/timetable`,
          icon: '🗓️',
        },
        {
          label: 'Announcements',
          href: `${base}/announcements`,
          icon: '📢',
        },
      ],
    },
    {
      title: 'Subject Teaching',
      // Each subject this teacher teaches in this class — rendered as children.
      // The parent item is a gateway; subjects are fetched from SubjectTeacher
      // where classId = selected classId and teacherId = current teacher.
      items: [
        {
          label: 'My Subjects',
          href: `${base}/subjects`,
          icon: '📚',
        },
        {
          label: 'Scores',
          href: `${base}/scores/sheet`,
          icon: '🕓',
        },
        {
          label: 'Assignments',
          href: `${base}/assignments`,
          icon: '📋',
          children: [
            {
              label: 'Create Assignment',
              href: `${base}/assignments/create`,
              icon: '➕',
            },
            {
              label: 'Submissions',
              href: `${base}/assignments/submissions`,
              icon: '📥',
            },
            {
              label: 'Grade Assignments',
              href: `${base}/assignments/grade`,
              icon: '🏷️',
            },
          ],
        },
        {
          label: 'Lesson Plans',
          href: `${base}/lesson-plans`,
          icon: '🗒️',
        },
        {
          label: 'Resources',
          href: `${base}/resources`,
          icon: '📁',
        },
      ],
    },
  ];
}

// These are not class-scoped — they belong to the teacher regardless of which
// class is currently selected.
export const personalNavSection: NavSection = {
  title: 'Personal',
  items: [
    {
      label: 'My Profile',
      href: '/dashboard/teacher/profile',
      icon: '👤',
    },
    {
      label: 'My Schedule',
      href: '/dashboard/teacher/schedule',
      icon: '📆',
    },
    {
      label: 'Leave Requests',
      href: '/dashboard/teacher/leave',
      icon: '🏖️',
    },
  ],
};


// ─── src/utils/teacher.ts addition ───────────────────────────────────────────
//
// Builds sidebar nav sections for a subject-only teacher (no class
// assignment). One NavSection per class they teach in; subjects nested as
// children with direct links to score entry and assignments for that
// specific subject.
//
// A subject teacher can:
//   - View the subjects they teach per class
//   - Enter CA / Exam scores for each subject
//   - Manage assignments for each subject
//
// They CANNOT access:
//   - Attendance marking (class teacher only)
//   - Report cards (class teacher only)
//   - Class overview / timetable / announcements (class-scoped, irrelevant)

export function buildSubjectTeacherNavSections(
  classes: {
    classId: string;
    className: string;
    subjects: { subjectId: string; subjectName: string; subjectCode: string | null }[];
  }[],
): NavSection[] {
  if (classes.length === 0) return [];

  return classes.map((cls) => ({
    title: cls.className,
    items: [
      // Gateway: subject picker for this class (same MySubjectsPage used by
      // class teachers, but filtered to this teacher's own subjects only).
      {
        label: 'My Subjects',
        href:  `/dashboard/teacher/classes/${cls.classId}/subjects`,
        icon:  '📚',
        // Each subject is a child link — direct entry into score landing page.
        children: cls.subjects.map((subject) => ({
          label: subject.subjectName,
          href:  `/dashboard/teacher/classes/${cls.classId}/subjects/${subject.subjectId}/scores`,
          icon:  subject.subjectCode ? `${subject.subjectCode}` : '·',
        })),
      },
      // Assignments scoped to this class — teacher manages work for their
      // own subjects here. Pages filter by teacherId server-side so they
      // only see assignments they created.
      {
        label: 'Assignments',
        href:  `/dashboard/teacher/classes/${cls.classId}/assignments`,
        icon:  '📋',
        children: [
          {
            label: 'Create Assignment',
            href:  `/dashboard/teacher/classes/${cls.classId}/assignments/create`,
            icon:  '➕',
          },
          {
            label: 'Submissions',
            href:  `/dashboard/teacher/classes/${cls.classId}/assignments/submissions`,
            icon:  '📥',
          },
          {
            label: 'Grade Assignments',
            href:  `/dashboard/teacher/classes/${cls.classId}/assignments/grade`,
            icon:  '🏷️',
          },
        ],
      },
    ] satisfies NavItem[],
  }));
}
