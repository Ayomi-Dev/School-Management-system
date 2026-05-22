import z from "zod";


export const classLevelEnum = z.enum([
  "CRECHE", "NURSERY1", "NURSERY2",
  "PRIMARY1", "PRIMARY2", "PRIMARY3", "PRIMARY4", "PRIMARY5", "PRIMARY6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3",
]);

export const createClassSchema = z.object({
  name:       z.string().min(1, "Class name is required"),
  level:      classLevelEnum,
  order:      z.number().int().min(1),
  department: z.enum(["ART", "COMMERCIAL", "SCIENCE"]).optional(),
});
 
export const updateClassSchema = createClassSchema.partial();


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