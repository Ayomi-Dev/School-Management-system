import { z } from 'zod'


export const LoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    schoolId: z.string().min(1, "School ID is required")
})

export type LoginInput = z.infer<typeof LoginSchema>