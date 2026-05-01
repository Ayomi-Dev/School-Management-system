import z from "zod"
 
export const userLoginSchema = z.object({
  userCode: z.string().min(1, "User code is required").transform((v) => v.trim().toUpperCase()),
  password: z.string().min(1, "Password is required"),
  email:    z.undefined({ error: "Use your user code, not email" }).optional(),
});


export type UserLoginInput = z.infer<typeof userLoginSchema>;