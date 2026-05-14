import { z } from "zod"
import { baseSchemaForUserCreation } from "./baseSchema"
import { Role } from "@/app/generated/prisma/enums";




export const bursarSchema = baseSchemaForUserCreation.extend({
    role: z.literal(Role.BURSAR)
})