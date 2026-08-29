import { prisma } from "@/src/lib/prisma/client";
import { PaymentMethod, PaymentStatus } from "@/app/generated/prisma/enums";

// ============================================================
// TYPES
// ============================================================

export interface CreateFeeStructureInput {
  schoolId: string;
  classId?: string;
  termId: string;
  name: string;
  amount: number;
  isOptional?: boolean;
}

export interface AssignFeeBalancesInput {
  feeStructureId: string;
  classId: string;
  academicYearId: string;
}

export interface RecordPaymentInput {
  studentId: string;
  termId: string;
  feeStructureId?: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  recordedById?: string;
  note?: string;
  status?: PaymentStatus
}

// ============================================================
// FEE STRUCTURE
// ============================================================

export async function createFeeStructure(input: CreateFeeStructureInput) {
  const { schoolId, classId, termId, name, amount, isOptional = false } = input;

  return prisma.feeStructure.create({
    data: { 
      schoolId, 
      classId: classId ?? null, 
      termId, 
      name, 
      amount, 
      isOptional,
      status: "NOT_PAID" 
    },
    include: { class: { select: { level: true } }, term: { select: { period: true } } },
  });
}

export async function listFeeStructures(schoolId: string, termId: string) {
  return prisma.feeStructure.findMany({
    where: { schoolId, termId },
    include: { class: { select: { level: true } } },
    orderBy: { name: "asc" },
  });
}

// ============================================================
// ASSIGN FEE BALANCES TO CLASS
// ============================================================

/**
 * Assigns fee balances for all students in a class for a given fee structure.
 * Idempotent: existing balances are not overwritten (use updateFeeBalance for adjustments).
 */
export async function assignFeeBalancesToClass(input: AssignFeeBalancesInput) {
  const { feeStructureId, classId, academicYearId } = input;

  const feeStructure = await prisma.feeStructure.findUniqueOrThrow({
    where: { id: feeStructureId },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { classId, academicYearId },
    select: { studentId: true },
  });

  const creates = enrollments.map((e) =>
    prisma.feeBalance.upsert({
      where: {
        studentId_feeStructureId: {
          studentId: e.studentId,
          feeStructureId,
        },
      },
      update: {}, // Don't overwrite existing balance
      create: {
        studentId: e.studentId,
        feeStructureId,
        amountDue: feeStructure.amount,
        amountPaid: 0,
      },
    })
  );

  return Promise.all(creates);
}

// ============================================================
// RECORD PAYMENT
// ============================================================

function generateReceiptNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RCT-${ts}-${rand}`;
}

export async function recordPayment(input: RecordPaymentInput) {
  const {
    studentId,
    termId,
    feeStructureId,
    amount,
    paymentDate,
    paymentMethod,
    recordedById,
    note,
  } = input;

  if (amount <= 0) throw new Error("Payment amount must be greater than 0.");

  return prisma.$transaction(async (tx) => {
    // 1. Create payment record
    const payment = await tx.feePayment.create({
      data: {
        studentId,
        termId,
        feeStructureId: feeStructureId ?? null,
        receiptNumber: generateReceiptNumber(),
        amount,
        paymentDate,
        paymentMethod,
        recordedById: recordedById ?? null,
        note: note ?? null,
        status: "PAID"
      },
      include: {
        student: { select: { firstName: true, lastName: true, studentNumber: true } },
        term: { select: { period: true } },
      },
    });

    // 2. Update fee balance if feeStructureId is provided
    if (feeStructureId) {
      const balance = await tx.feeBalance.findUnique({
        where: { studentId_feeStructureId: { studentId, feeStructureId } },
      });

      if (balance) {
        const newAmountPaid = balance.amountPaid + amount;
        await tx.feeBalance.update({
          where: { studentId_feeStructureId: { studentId, feeStructureId } },
          data: { amountPaid: newAmountPaid },
        });
      }
    }

    return payment;
  });
}

// ============================================================
// QUERIES
// ============================================================

export async function getStudentFeeStatement(studentId: string, termId: string) {
  const [balances, payments] = await Promise.all([
    prisma.feeBalance.findMany({
      where: {
        studentId,
        feeStructure: { termId },
      },
      include: {
        feeStructure: { select: { name: true, amount: true, isOptional: true } },
      },
    }),
    prisma.feePayment.findMany({
      where: { studentId, termId },
      orderBy: { paymentDate: "desc" },
    }),
  ]);

  const totalDue = balances.reduce((s, b) => s + b.amountDue, 0);
  const totalPaid = balances.reduce((s, b) => s + b.amountPaid, 0);
  const outstanding = totalDue - totalPaid;

  return { balances, payments, totalDue, totalPaid, outstanding };
}

export async function getClassFeeOverview(
  classId: string,
  termId: string,
  academicYearId: string
) {
  const enrollments = await prisma.enrollment.findMany({
    where: { classId, academicYearId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          studentNumber: true,
          feeBalances: {
            where: { feeStructure: { termId } },
            include: { feeStructure: { select: { name: true } } },
          },
        },
      },
    },
  });

  return enrollments.map((e) => {
    const totalDue = e.student.feeBalances.reduce((s, b) => s + b.amountDue, 0);
    const totalPaid = e.student.feeBalances.reduce((s, b) => s + b.amountPaid, 0);
    return {
      studentId: e.student.id,
      name: `${e.student.firstName} ${e.student.lastName}`,
      studentNumber: e.student.studentNumber,
      totalDue,
      totalPaid,
      outstanding: totalDue - totalPaid,
      isCleared: totalDue - totalPaid <= 0,
    };
  });
}

export async function getStudentPaymentHistory(studentId: string) {
  return prisma.feePayment.findMany({
    where: { studentId },
    include: {
      term: { select: { period: true, academicYearId: true } },
    },
    orderBy: { paymentDate: "desc" },
  });
}