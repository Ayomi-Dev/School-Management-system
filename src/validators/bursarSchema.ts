import { z } from "zod"
import { baseSchema } from "./baseSchema"

export const bursarSchema = baseSchema.extend({
    role: z.literal("BURSAR")
})