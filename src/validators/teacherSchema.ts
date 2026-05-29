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
    .max(10, "A teacher can be assigned at most 10 subjects")
    .optional(),
 
  qualification: z
    .string()
    .max(100, "Qualification must be 100 characters or fewer")
    .optional(),

  employmentType: EmploymentType.optional(),
 
  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Joining date must be in YYYY-MM-DD format")
    .optional(),
});


// Subject assignment:
// Route: POST /schools/:schoolId/teachers/:teacherEmployeeNumber/subjects
// classId and termId resolved from route params (class name + current term)
export const assignSubjectToTeacherSchema = z.object({
  subjectName:  z.string().min(1),    // resolved to Subject by name within school
  className:    z.string().min(1),    // resolved to Class by name within school
  // termId resolved server-side from current active term unless overridden
  teacherNumber: z.string().min(1)
});




// Class teacher assignment:
// Route: POST /schools/:schoolId/classes/:className/teacher
export const assignClassTeacherSchema = z.object({
  teacherEmployeeNumber: z.string().min(1),
  isClassTeacher:        z.boolean().default(false),
  // academicYearLabel optional — falls back to current active year
  academicYearLabel:     z.string().optional(),
});
 
