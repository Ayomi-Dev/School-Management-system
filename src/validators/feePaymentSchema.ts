
// ============================================================
// FEES
// ============================================================
import z from "zod";


const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'POS', 'ONLINE'] as const;


export const createFeeStructureSchema = z.object({
  classId: z.string().optional(),
  termId: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().positive(),
  isOptional: z.boolean().optional(),
});
export type CreateFeeStructureFormData = z.infer<typeof createFeeStructureSchema>;

export const recordFeePaymentSchema = z.object({
  studentId: z.string().min(1),
  termId: z.string().min(1),
  feeStructureId: z.string().optional(),
  amount: z.number().positive(),
  paymentDate: z.coerce.date(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  note: z.string().optional(),
});

export const assignFeeSchema = z.object({
  classId:        z.string().min(1, 'Class is required'),
  academicYearId: z.string().min(1, 'Academic year is required')
});
export type AssignFormData = z.infer<typeof assignFeeSchema>;

 
export const recordPaymentSchema = z.object({
  studentId:       z.string().min(1),
  termId:          z.string().min(1),
  feeStructureId:  z.string().optional(),
  amount:          z.number().positive('Amount must be greater than 0'),
  paymentDate:     z.string().datetime({ offset: true }).or(z.string().date()),
  paymentMethod:   z.enum(PAYMENT_METHODS),
  note:            z.string().trim().max(500).optional(),
  recordedById: z.string().trim().max(500).min(1)
});
 
export type RecordPaymentFormData = z.infer<typeof recordPaymentSchema>;
