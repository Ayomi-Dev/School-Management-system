import { TermPeriod } from "@prisma/client";
import z from "zod";

const PeriodEnum = z.nativeEnum(TermPeriod)

export const createAcademicYearSchema = z.object({
    label: z.string().min(1).max(20),
})

const termFieldsSchema = z.object({
  period: PeriodEnum,
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isCurrent: z.boolean().optional(),
});

const validateTermDateRange = (data: { startDate: string; endDate: string }) =>
  new Date(data.startDate) < new Date(data.endDate);

const termDateRangeError = {
  message: 'Start date must be before end date',
  path: ['endDate'] as ['endDate'],
};

// Form fields exclude the academic year ID because that value comes from the active-year query.
export const createTermFormSchema = termFieldsSchema.refine(
  validateTermDateRange,
  termDateRangeError
);

export const createTermSchema = termFieldsSchema.extend({
  academicYearId: z.string().min(1, 'Academic year ID is required'),
}).refine(
  validateTermDateRange,
  termDateRangeError
);
