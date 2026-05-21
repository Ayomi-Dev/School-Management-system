import z from "zod";



// ============================================================
// SCORES  SCHEMA
// ============================================================
export const upsertScoreSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  termId: z.string().min(1),
  caScore: z.number().min(0).max(100).optional(),
  examScore: z.number().min(0).max(100).optional(),
});

export const bulkUpsertScoresSchema = z.object({
  termId: z.string().min(1),
  subjectId: z.string().min(1),
  scores: z
    .array(
      z.object({
        studentId: z.string().min(1),
        caScore: z.number().min(0).max(100).optional(),
        examScore: z.number().min(0).max(100).optional(),
      })
    )
    .min(1),
});

export const publishScoresSchema = z.object({
  termId: z.string().min(1),
  subjectId: z.string().min(1),
  studentIds: z.array(z.string()).optional(), // if omitted → publish all
});
