import { z } from "zod";
import { baseSchemaForUserCreation } from "./baseSchema";
import { Role, Department, EmployeeType } from "@/app/generated/prisma/enums";


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