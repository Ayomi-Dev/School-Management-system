import { z } from 'zod'
import { superAdminLoginSchema } from './superAdminSchema'
import { userLoginSchema } from './userLoginSchema'


export const loginSchema = z.union([
    superAdminLoginSchema, userLoginSchema
])

export const accountSetupSchema = z.object({
    userCode: z.string().min(1).max(50).optional(),
    oldPassword: z.string(),
    newPassword: z.string(),
    email: z.string().optional(),
    confirmNewPassword: z.string()
})



export type UserLoginInput = z.infer<typeof loginSchema>
export type AccountSetUpInput = z.infer<typeof accountSetupSchema>