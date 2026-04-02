import { z } from "zod";
import { baseSchema } from "./baseSchema";

export const studentSchema = baseSchema.extend({
  role: z.literal("STUDENT"),
 
  gradeLevel: z
    .string({ error: "Grade level is required" })
    .min(1, "Grade level is required"),
 
  section: z
    .string()
    .max(10, "Section must be 10 characters or fewer")
    .optional(),
 
  stateOfOrigin: z
    .string()
    .max(50, "State of origin must be 50 characters or fewer")
    .optional(),
 
  previousSchool: z
    .string()
    .max(100, "Previous school name must be 100 characters or fewer")
    .optional(),
 
  medicalNotes: z
    .string()
    .max(500, "Medical notes must be 500 characters or fewer")
    .optional(),
 
  // Optional: link the student to an existing parent account at creation time
  parentUserId: z
    .string()
    .uuid("Parent user ID must be a valid UUID")
    .optional(),
});