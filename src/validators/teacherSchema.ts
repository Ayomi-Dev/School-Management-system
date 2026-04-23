import { z } from "zod";
import { baseSchemaForUserCreation } from "./baseSchema";

export const EmploymentType = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"])  // a tuple of string literals, which z.enum can use to create a type-safe enum


export const teacherSchema = baseSchemaForUserCreation.extend({
  role: z.literal("TEACHER"),
 
  subjects: z
    .array(z.string().min(1))
    .min(1, "At least one subject is required")
    .max(10, "A teacher can be assigned at most 10 subjects"),
 
  qualification: z
    .string()
    .max(100, "Qualification must be 100 characters or fewer")
    .optional(),
 
  yearsExperience: z
    .number()
    .int("Years of experience must be a whole number")
    .min(0, "Years of experience cannot be negative")
    .max(60, "Years of experience seems too high")
    .optional(),
 
  department: z
    .string()
    .max(100, "Department name must be 100 characters or fewer")
    .optional(),
 
  employmentType: EmploymentType.optional(),
 
  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Joining date must be in YYYY-MM-DD format")
    .optional(),
});