import { z } from "zod"
import { baseSchemaForUserCreation } from "./baseSchema"

export const bursarSchema = baseSchemaForUserCreation.extend({
    role: z.literal("BURSAR")
})