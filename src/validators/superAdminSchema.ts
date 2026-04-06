import { z } from "zod"

export const superAdminLoginSchema = z.object({
  email:    z.string().email("Must be a valid email address").transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
  userCode: z.undefined({ error: "Use email to log in as super admin" }).optional(),
});