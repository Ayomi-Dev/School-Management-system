import { z } from "zod"
import { baseSchemaForUserCreation } from "./baseSchema"
import { studentSchema } from "./studentSchema";
import { teacherSchema } from "./teacherSchema";
import { parentSchema } from "./parentSchema";
import { bursarSchema } from "./bursarSchema";


export const adminSchema = baseSchemaForUserCreation.extend({
    role: z.literal("ADMIN")
})


// ── Discriminated union — the single export used by the route ──────────────────
// Zod picks the correct sub-schema based on the `role` field value.
// Validation errors are role-specific — e.g. "Grade level is required" only
// appears when role === "STUDENT", not for teachers or parents.
export const adminCreateUserSchema = z.discriminatedUnion("role", [
  studentSchema,
  teacherSchema,
  parentSchema,
  bursarSchema,
  adminSchema,
]);



// ── Inferred types (use these in the route handler for full type safety) ───────
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type StudentInput         = z.infer<typeof studentSchema>;
export type TeacherInput         = z.infer<typeof teacherSchema>;
export type ParentInput          = z.infer<typeof parentSchema>;
export type BursarInput          = z.infer<typeof bursarSchema>;
export type AdminInput           = z.infer<typeof adminSchema>;