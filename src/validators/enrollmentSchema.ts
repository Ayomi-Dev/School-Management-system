import { z } from "zod";

export const enrollmentPromotionQuerySchema = z.object({
  sourceAcademicYearId: z.string().optional(),
  sourceClassId: z.string().optional(),
  targetAcademicYearId: z.string().optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const promoteStudentsSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1).max(100)
    .refine((ids) => new Set(ids).size === ids.length, "Student IDs must be unique."),
  sourceAcademicYearId: z.string().min(1),
  sourceClassId: z.string().min(1),
  targetAcademicYearId: z.string().min(1),
  targetClassId: z.string().min(1),
});
