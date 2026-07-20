// ─── Timetable types ──────────────────────────────────────────────────────────

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY';

export interface TimetableSlot {
  id:        string;
  classId:   string;
  dayOfWeek: DayOfWeek;
  startTime: string;   // "08:00"
  endTime:   string;   // "09:00"
  room:      string | null;
  subject: {
    id:   string;
    name: string;
    code: string;
  };
  teacher: {
    id:   string;        // TeacherProfile.id
    user: {
      id:        string;
      firstName: string;
      lastName:  string;
    };
  };
}

// Response shape from GET /admin/classes/:classId/timetable
export interface ClassTimetable {
  classId:   string;
  classLevel: string;
  slots:     TimetableSlot[];
}

// ─── Create / update ──────────────────────────────────────────────────────────

export interface CreateTimetableSlotBody {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime:   string;
  subjectId: string;
  teacherId: string;   // TeacherProfile.id
  room?:     string;
}

export interface CreateTimetableSlotResponse {
  message: string;
  data:    TimetableSlot;
}

export interface UpdateTimetableSlotBody {
  startTime?: string;
  endTime?:   string;
  subjectId?: string;
  teacherId?: string;
  room?:      string | null;
}

export interface UpdateTimetableSlotResponse {
  message: string;
  data:    TimetableSlot;
}

// ─── Class teachers list (for the modal dropdown) ─────────────────────────────
// Returns all teachers assigned to teach subjects in this class.

export interface ClassTeacher {
  teacherProfileId: string;
  userId:           string;
  firstName:        string;
  lastName:         string;
  subjects:         Array<{ id: string; name: string }>;
}