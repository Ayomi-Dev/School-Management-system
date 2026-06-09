import { ClassLevel } from "@/app/generated/prisma/enums";
import { z } from "zod";
const ClassLevelEnum = z.enum(ClassLevel)
export const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().optional(),
  level: ClassLevelEnum.optional(), // ← optional: only pass to reclassify
});
 
export const updateSubjectSchema = createSubjectSchema.partial();