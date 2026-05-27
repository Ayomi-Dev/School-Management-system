import { z } from "zod";
import { baseSchemaForUserCreation } from "./baseSchema";
import { Role, Department, EmployeeType } from "@/app/generated/prisma/enums";
import { classLevelEnum } from "./classSchema";


export const EmploymentType = z.enum(EmployeeType)  // Create a Zod enum from the Prisma EmployeeType enum values
const DepartmentEnum = z.enum(Department) // Create a Zod enum from the Prisma Department enum values 


export const teacherSchema = baseSchemaForUserCreation.extend({
  role: z.literal(Role.TEACHER),
  department: DepartmentEnum.optional(),

  subjects: z
    .array(z.string().min(1))
    .min(1, "At least one subject is required")
    .max(10, "A teacher can be assigned at most 10 subjects"),
 
  qualification: z
    .string()
    .max(100, "Qualification must be 100 characters or fewer")
    .optional(),
  employeeNumber: z
    .string()
    .max(20, "Employee number must be 20 characters or fewer"),

  yearsExperience: z
    .number()
    .int("Years of experience must be a whole number")
    .min(0, "Years of experience cannot be negative")
    .max(60, "Years of experience seems too high")
    .optional(),
 
  employmentType: EmploymentType.optional(),
 
  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Joining date must be in YYYY-MM-DD format")
    .optional(),
});


// Subject assignment:
// Route: POST /schools/:schoolId/teachers/:teacherEmployeeNumber/subjects
// IDs are resolved server-side from provided names/periods
export const assignSubjectToTeacherSchema = z.object({
  subjectName: z.string().min(1, "Subject name is required"),
  className: z.string().min(1, "Class name is required"),
  termPeriod: z.string().optional(),
});

// Class teacher assignment:
// Route: POST /schools/:schoolId/classes/:className/teacher
export const assignClassTeacherSchema = z.object({
  teacherEmployeeNumber: z.string().min(1, "Teacher employee number is required"),
  isClassTeacher: z.boolean().default(false),
  academicYearLabel: z.string().optional(),
});
