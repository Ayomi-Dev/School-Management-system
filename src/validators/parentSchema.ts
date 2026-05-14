import { z } from "zod";
import { baseSchemaForUserCreation } from "./baseSchema";
import { Role, Relationship } from "@/app/generated/prisma/enums";


export const RelationshipType = z.enum(Relationship)

export const parentSchema = baseSchemaForUserCreation.extend({
  role: z.literal(Role.PARENT),

      // Guardian.phone is non-optional — require it for parents
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-().]{7,20}$/, "Invalid phone number format"),
 

  relationship: RelationshipType.optional(),
 
  occupation: z
    .string()
    .max(100, "Occupation must be 100 characters or fewer")
    .optional(),
 
  // Optional: link to one or more existing student accounts at creation time
  studentUserIds: z
    .array(z.uuid("Each student ID must be a valid UUID"))
    .max(10, "Cannot link more than 10 students at once")
    .optional(),
});