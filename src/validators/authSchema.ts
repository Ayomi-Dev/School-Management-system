import { z } from 'zod'
import { superAdminLoginSchema } from './superAdminSchema'
import { userLoginSchema } from './userLoginSchema'


export const loginSchema = z.union([
    superAdminLoginSchema, userLoginSchema
])