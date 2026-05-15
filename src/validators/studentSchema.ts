import { z } from "zod";
import { baseSchemaForUserCreation } from "./baseSchema";
import { Role, Gender, ClassLevel } from "@/app/generated/prisma/enums";



const ClassLevelEnum = z.enum(ClassLevel)
const GenderEnum = z.enum(Gender)

export const studentSchema = baseSchemaForUserCreation.extend({
  role: z.literal(Role.STUDENT),
 
  gradeLevel: ClassLevelEnum,
  gender: GenderEnum,

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