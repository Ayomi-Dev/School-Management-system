import { z } from "zod"

// ============================================================
// ATTENDANCE
// ============================================================

export const createClassSessionSchema = z.object({
  classId: z.string().min(1),
  termId: z.string().min(1),
  teacherId: z.string().optional(),
  date: z.coerce.date(),
  label: z.string().optional(),
});
// export const markAttendanceSchema = z.object({
//   sessionId: z.string().min(1),
//   records: z
//     .array(
//       z.object({
//         studentId: z.string().min(1),
//         status: z.enum(["PRESENT", "ABSENT", "LATE", "UNMARKED"]),
//         remark: z.string().optional(),
//       })
//     )
//     .min(1),
// });

export const attendanceQuerySchema = z.object({
  classId: z.string().optional(),
  studentId: z.string().optional(),
  termId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});


export const markAttendanceSchema = z.object({
  sessionId: z.string().min(1),
  entries: z
    .array(
      z.object({
        attendanceId: z.string().min(1),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
        remark: z.string().optional(),
      }),
    )
    .min(1, 'At least one attendance entry is required.'),
});
