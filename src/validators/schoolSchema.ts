import { z } from "zod"


export const createSchoolAndAdminSchema = z.object({
  // School and admin fields
  school: z.object({
    name:    z.string().min(2, "School name is required").max(100),
    address: z.string().max(200).optional(),
    phone:   z.string().max(20).optional(),
    email:   z.string().email("School email must be valid").optional(),
    logoUrl: z.string().url("Logo URL must be a valid URL").optional(),
  }),
 
  // Admin to create for this school — optional at school creation time.
  // Super admin can create the school first, then provision the admin later
  // via POST /api/super-admin/schools/:schoolId/admin
  admin: z
    .object({
      firstName: z.string().min(1).max(50),
      lastName:  z.string().min(1).max(50),
      email:     z
        .string()
        .email("Admin email must be valid")
        .transform((v) => v.toLowerCase().trim()),
      phone: z.string().max(20).optional(),
    })
    .optional(),
}); 