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

export const updateReportCardSchema= z.discriminatedUnion('action', [
  z.object({
    action: z.literal('remark'),
    teacherRemark: z.string().max(2000),
  }),
  z.object({
    action: z.literal('publish'),
  }),
]);

export const updatePrincipalRemarkSchema = z.object({
  principalRemark: z.string().trim().min(1, 'A principal remark is required before publishing.').max(2000),
});

export const compileSchema = z.object({
  studentId: z.string().min(1),
  termId: z.string().min(1).optional(),
});
