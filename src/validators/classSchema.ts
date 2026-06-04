import { ClassLevel } from "@/app/generated/prisma/enums";
import z from "zod";


export const classLevelEnum = z.enum(ClassLevel);

export const createClassSchema = z.object({
  name:       z.string().min(1, "Class name is required"),
  level:      classLevelEnum,
  order:      z.number().int().min(1),
  department: z.enum(["ART", "COMMERCIAL", "SCIENCE"]).optional(),
});
 
export const updateClassSchema = createClassSchema.partial();
export type CreateClassInput = z.infer<typeof createClassSchema>


// SUBJECT
// schoolId from session; teacherId from route param so admin
// explicitly binds it: POST /schools/:schoolId/subjects
// teacherId is optional at creation — can be assigned later
// via the teacher-subject assignment endpoint.
// ─────────────────────────────────────────────────────────────
 
export const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().optional(),
});
 
export const updateSubjectSchema = createSubjectSchema.partial();