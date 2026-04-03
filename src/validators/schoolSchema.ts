import { z } from "zod"


export const createSchoolSchema = z.object({
  // School fields
  school: z.object({
    name:    z.string().min(2, "School name is required").max(100),
    address: z.string().max(200).optional(),
    phone:   z.string().max(20).optional(),
    email:   z.string().email("School email must be valid").optional(),
    logoUrl: z.string().url("Logo URL must be a valid URL").optional(),
  }),

}); 