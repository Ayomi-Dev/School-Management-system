// ============================================================
// REPORT CARDS
// ============================================================

import z from "zod";

export const generateReportCardSchema = z.object({
  termId: z.string().min(1),
  academicYearId: z.string().min(1),
  studentIds: z.array(z.string()).optional(), // omit → generate for whole class
  classId: z.string().optional(),
});

export const updateReportCardSchema = z.object({
  teacherRemark: z.string().optional(),
  principalRemark: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});
