import { z } from "zod";
import { baseSchemaForUserCreation } from "./baseSchema";
import { Role, Gender, ClassLevel } from "@/app/generated/prisma/enums";
import { classLevelEnum } from "./classSchema";



const ClassLevelEnum = z.enum(ClassLevel)
const GenderEnum = z.enum(Gender)

export const studentSchema = baseSchemaForUserCreation.extend({
  role: z.literal(Role.STUDENT),
 
  gender: GenderEnum,

  // Enrollment
  level: classLevelEnum,

  // Optional guardian linking
  guardianUserIds: z.array(z.string()).optional(),

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

export const updateStudentSchema = z.object({
  firstName: z.string().min(1).optional(),
  middleName: z.string().optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  photoUrl: z.string().url().optional(),
  stateOfOrigin: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(["ACTIVE", "GRADUATED", "TRANSFERRED", "SUSPENDED", "WITHDRAWN"]).optional(),
  exitReason: z.string().optional(),
  level: z.enum([
    "CRECHE", "NURSERY1", "NURSERY2",
    "PRIMARY1", "PRIMARY2", "PRIMARY3", "PRIMARY4", "PRIMARY5", "PRIMARY6",
    "JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3",
  ]).optional(),
});

export const promoteStudentSchema = z.object({
  studentIds: z.array(z.string()).min(1),
  newClassId: z.string().min(1),
  newAcademicYearId: z.string().min(1),
});

export const listStudentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  classId: z.string().optional(),
  academicYearId: z.string().optional(),
  status: z.enum(["ACTIVE", "GRADUATED", "TRANSFERRED", "SUSPENDED", "WITHDRAWN"]).optional(),
  search: z.string().optional(), // firstName | lastName | studentNumber
});

