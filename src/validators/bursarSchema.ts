import { z } from "zod"
import { baseSchemaForUserCreation } from "./baseSchema"
import { Role } from "@prisma/client"




export const bursarSchema = baseSchemaForUserCreation.extend({
    role: z.literal(Role.BURSAR)
})