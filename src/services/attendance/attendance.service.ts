import { prisma } from "@/src/lib/prisma/client";
import { AttendanceStatus } from "@/app/generated/prisma/enums";

// ============================================================
// TYPES
// ============================================================

export interface CreateClassSessionInput {
  classId: string;
  termId: string;
  teacherId?: string;
  date: Date;
  label?: string; // e.g. "Morning", "Afternoon" for schools with multiple sessions
}

export interface MarkAttendanceInput {
  sessionId: string;
  markedById: string; // TeacherProfile.id
  records: {
    studentId: string; // StudentProfile.id
    status: AttendanceStatus;
    remark?: string;
  }[];
}

export interface BulkMarkAttendanceInput {
  sessionId: string;
  markedById: string;
  defaultStatus?: AttendanceStatus; // status applied to any student not in `records`
  records: {
    studentId: string;
    status: AttendanceStatus;
    remark?: string;
  }[];
}

export interface AttendanceSummaryFilter {
  classId: string;
  termId: string;
  studentId?: string;
  from?: Date;
  to?: Date;
}
export interface MarkTeacherAttendanceInput {
      sessionId: string;
      teacherId: string;
      isPresent: boolean;
      substituteTeacherId?: string; // if teacher is absent, who covered
    }

// ============================================================
// CLASS SESSION MANAGEMENT
// ============================================================

/**
 * Opens a new class session (required before marking attendance).
 * Idempotent: if a session already exists for (classId, date, label), returns it.
 */
export const attendanceServices = {

    async openClassSession(input: CreateClassSessionInput) {
      const { classId, termId, teacherId, date, label } = input;
    
      // Normalise date to midnight UTC so sessions are date-unique
      const sessionDate = new Date(date);
      sessionDate.setUTCHours(0, 0, 0, 0);
    
      const existing = await prisma.classSession.findUnique({
        where: {
          classId_date_label: {
            classId,
            date: sessionDate,
            label: label ?? "",
          },
        },
        include: { attendances: true },
      });
      if (existing) return existing;
    
      // Find all enrolled students to pre-populate UNMARKED attendance rows
      const enrollments = await prisma.enrollment.findMany({
        where: {
          classId,
          academicYear: { terms: { some: { id: termId } } },
        },
        select: { studentId: true },
      });
    
      return prisma.$transaction(async (tx) => {
        const session = await tx.classSession.create({
          data: {
            classId,
            termId,
            teacherId: teacherId ?? null,
            date: sessionDate,
            label: label ?? null,
            isCompleted: false,
          },
        });
    
        // Pre-populate attendance records as UNMARKED for all enrolled students
        if (enrollments.length > 0) {
          await tx.attendance.createMany({
            data: enrollments.map((e) => ({
              sessionId: session.id,
              studentId: e.studentId,
              status: AttendanceStatus.UNMARKED,
              markedById: teacherId ?? null,
            })),
          });
        }
    
        return tx.classSession.findUnique({
          where: { id: session.id },
          include: {
            attendances: {
              include: {
                student: { select: { firstName: true, lastName: true, studentNumber: true } },
              },
            },
            class: { select: { name: true, level: true } },
          },
        });
      });
    },
    
    async closeClassSession(sessionId: string) {
      return prisma.classSession.update({
        where: { id: sessionId },
        data: { isCompleted: true },
      });
    },
    
    // ============================================================
    // MARK STUDENT ATTENDANCE
    // ============================================================
    
    /**
     * Mark attendance for individual students in a session.
     * Uses upsert so it's safe to call multiple times (corrections allowed before session is closed).
     */
    async markAttendance(input: MarkAttendanceInput) {
      const { sessionId, markedById, records } = input;
    
      const session = await prisma.classSession.findUniqueOrThrow({
        where: { id: sessionId },
      });
    
      if (session.isCompleted) {
        throw new Error("Cannot mark attendance on a completed session.");
      }
    
      const upserts = records.map((r) =>
        prisma.attendance.upsert({
          where: {
            sessionId_studentId: { sessionId, studentId: r.studentId },
          },
          update: {
            status: r.status,
            remark: r.remark ?? null,
            markedById,
          },
          create: {
            sessionId,
            studentId: r.studentId,
            status: r.status,
            remark: r.remark ?? null,
            markedById,
          },
        })
      );
    
      const results = await prisma.$transaction(upserts);
      return results;
    },
    
    /**
     * Mark a whole class at once, applying defaultStatus to any
     * enrolled student not explicitly listed in records.
     */
    async bulkMarkAttendance(input: BulkMarkAttendanceInput) {
      const { sessionId, markedById, records, defaultStatus = AttendanceStatus.PRESENT } = input;
    
      const session = await prisma.classSession.findUniqueOrThrow({
        where: { id: sessionId },
        include: { attendances: { select: { studentId: true } } },
      });
    
      if (session.isCompleted) {
        throw new Error("Cannot mark attendance on a completed session.");
      }
    
      const explicitIds = new Set(records.map((r) => r.studentId));
      const unmappedIds = session.attendances
        .map((a) => a.studentId)
        .filter((id) => !explicitIds.has(id));
    
      const allRecords = [
        ...records,
        ...unmappedIds.map((id) => ({
          studentId: id,
          status: defaultStatus,
          remark: undefined as string | undefined,
        })),
      ];
    
      return this.markAttendance({ sessionId, markedById, records: allRecords });
    },
    
    // ============================================================
    // ATTENDANCE QUERIES
    // ============================================================
    
    async getSessionAttendance(sessionId: string) {
      return prisma.classSession.findUnique({
        where: { id: sessionId },
        include: {
          class: { select: { name: true, level: true } },
          teacher: { select: { firstName: true, lastName: true } },
          attendances: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  studentNumber: true,
                  photoUrl: true,
                },
              },
              markedBy: { select: { firstName: true, lastName: true } },
            },
            orderBy: { student: { lastName: "asc" } },
          },
        },
      });
    },
    
    async getStudentAttendanceSummary(
      filter: AttendanceSummaryFilter
    ) {
      const { classId, termId, studentId, from, to } = filter;
    
      const sessionWhere = {
        classId,
        termId,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      };
    
      const sessions = await prisma.classSession.findMany({
        where: sessionWhere,
        include: {
          attendances: {
            where: studentId ? { studentId } : {},
            include: {
              student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
            },
          },
        },
        orderBy: { date: "asc" },
      });
    
      // Aggregate per-student
      const studentMap = new Map<
        string,
        {
          studentId: string;
          name: string;
          studentNumber: string;
          total: number;
          present: number;
          absent: number;
          late: number;
          unmarked: number;
          attendanceRate: number;
        }
      >();
    
      for (const session of sessions) {
        for (const att of session.attendances) {
          const key = att.studentId;
          if (!studentMap.has(key)) {
            studentMap.set(key, {
              studentId: att.studentId,
              name: `${att.student.firstName} ${att.student.lastName}`,
              studentNumber: att.student.studentNumber,
              total: 0,
              present: 0,
              absent: 0,
              late: 0,
              unmarked: 0,
              attendanceRate: 0,
            });
          }
          const entry = studentMap.get(key)!;
          entry.total++;
          if (att.status === AttendanceStatus.PRESENT) entry.present++;
          else if (att.status === AttendanceStatus.ABSENT) entry.absent++;
          else if (att.status === AttendanceStatus.LATE) entry.late++;
          else entry.unmarked++;
          entry.attendanceRate =
            entry.total > 0
              ? Math.round(((entry.present + entry.late) / entry.total) * 100)
              : 0;
        }
      }
    
      return {
        totalSessions: sessions.length,
        students: Array.from(studentMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      };
    },
    
    async getClassSessionsByTerm(classId: string, termId: string) {
      return prisma.classSession.findMany({
        where: { classId, termId },
        include: {
          teacher: { select: { firstName: true, lastName: true } },
          _count: {
            select: {
              attendances: true,
            },
          },
        },
        orderBy: { date: "asc" },
      });
    },
    
    async getStudentAttendanceByTerm(
      studentId: string,
      termId: string
    ) {
        return prisma.attendance.findMany({
              where: {
                studentId,
                session: { termId },
              },
              include: {
                session: {
                  include: {
                    class: { select: { name: true } },
                  },
                },
              },
              orderBy: { session: { date: "desc" } },
        });
    },
    
    // ============================================================
    // TEACHER ATTENDANCE (for HR / admin use)
    // Tracks whether a teacher showed up to their assigned session
    // ============================================================
    
    /**
     * Records teacher presence for a class session.
     * Updates the session's teacherId field and completion state accordingly.
     */
    async markTeacherAttendance(input: MarkTeacherAttendanceInput) {
      const { sessionId, teacherId, isPresent, substituteTeacherId } = input;
    
      const session = await prisma.classSession.findUniqueOrThrow({
        where: { id: sessionId },
      });
    
      if (session.teacherId && session.teacherId !== teacherId) {
        throw new Error(
          "This session is assigned to a different teacher. Check the session assignment."
        );
      }
    
      // If absent and substitute provided, update session to reflect substitute
      const effectiveTeacherId = !isPresent && substituteTeacherId
        ? substituteTeacherId
        : teacherId;
    
      return prisma.classSession.update({
        where: { id: sessionId },
        data: {
          teacherId: effectiveTeacherId,
          label: !isPresent
            ? `[SUB${substituteTeacherId ? `: ${substituteTeacherId}` : ""}]`
            : session.label,
        },
        include: {
          teacher: { select: { firstName: true, lastName: true } },
          class: { select: { name: true } },
        },
      });
    },
    
    async getTeacherSessionHistory(
      teacherId: string,
      termId: string
    ) {
        return prisma.classSession.findMany({
            where: { teacherId, termId },
            include: {
              class: { select: { name: true, level: true } },
              _count: { select: { attendances: true } },
            },
            orderBy: { date: "desc" },
        });
    }
}