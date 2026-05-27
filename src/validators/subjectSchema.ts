import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().optional(),
   className: z.string().min(1).optional(), // ← optional: only pass to reclassify
});
 
export const updateSubjectSchema = createSubjectSchema.partial();