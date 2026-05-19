import { z } from "zod";

export const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8, "New password must be at least 8 characters long")
})

export const forgotPasswordSchema = z.object({
        email: z.string().email("Invalid email address").optional(),
        phone: z.string().optional()
    }).refine((data) => data.email || data.phone, {
        message: "Either email or phone number must be provided",
    }
)

export const resetPasswordSchema = z.object({
    newPassword: z.string().min(8, "New password must be at least 8 characters long"),
    token: z.string()
})