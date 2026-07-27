import z from "zod";

export const createAcademicYearSchema = z.object({
    label: z.string().min(1).max(20),
})