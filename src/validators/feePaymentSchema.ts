
// ============================================================
// FEES
// ============================================================

import z from "zod";

export const createFeeStructureSchema = z.object({
  classId: z.string().optional(),
  termId: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().positive(),
  isOptional: z.boolean().default(false),
});

export const recordFeePaymentSchema = z.object({
  studentId: z.string().min(1),
  termId: z.string().min(1),
  feeStructureId: z.string().optional(),
  amount: z.number().positive(),
  paymentDate: z.coerce.date(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "POS", "ONLINE"]).default("CASH"),
  note: z.string().optional(),
});