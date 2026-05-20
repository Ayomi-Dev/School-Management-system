import { z } from "zod";

export const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8, "New password must be at least 8 characters long")
})

export const forgotPasswordSchema = z.object({
    userCode: z.string()
})

export const resetPasswordSchema = z.object({
    newPassword: z.string().min(8, "New password must be at least 8 characters long"),
    token: z.string()
})