import { z } from "zod";
import { baseSchemaForUserCreation } from "./baseSchema";

export const RelationshipType = z.enum(["FATHER", "MOTHER", "GUARDIAN"])

export const parentSchema = baseSchemaForUserCreation.extend({
  role: z.literal("PARENT"),
 
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