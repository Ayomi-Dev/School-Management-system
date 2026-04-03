import { z } from "zod";
import { baseSchemaForUserCreation } from "./baseSchema";
import { ClassLevel } from "@/app/generated/prisma/enums";


const ClassLevelEnum = z.enum([
  ClassLevel.CRECHE,
  ClassLevel.NURSERY1,
  ClassLevel.NURSERY2,
  ClassLevel.PRIMARY3,
  ClassLevel.PRIMARY4,
  ClassLevel.PRIMARY5,
  ClassLevel.PRIMARY6,
  ClassLevel.JSS1,
  ClassLevel.JSS2,
  ClassLevel.JSS3,
  ClassLevel.SS1,
  ClassLevel.SS2,
  ClassLevel.SS3,
])
export const studentSchema = baseSchemaForUserCreation.extend({
  role: z.literal("STUDENT"),
 
  gradeLevel: ClassLevelEnum,
 
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