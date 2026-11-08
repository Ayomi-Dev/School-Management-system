import { prisma } from "@/src/lib/prisma/client";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  assignFeeSchema,
  createFeeStructureSchema,
  recordPaymentSchema,
  updateFeePaymentSchema,
} from "@/src/validators/feePaymentSchema";

// ============================================================
// TYPES
// ============================================================

 interface CreateFeeStructureInput {
  schoolId: string;
  classId?: string;
  termId: string;
  name: string;
  amount: number;
  isOptional?: boolean;
}

 interface AssignFeeBalancesInput {
  feeStructureId: string;
  classId: string;
  academicYearId: string;
}

 interface RecordPaymentInput {
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
const generateReceiptNumber= (): string => {
   const ts = Date.now().toString(36).toUpperCase();
   const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
   return `RCT-${ts}-${rand}`;
 }
export const feeServices = {

  async createFeeStructure(req: NextRequest, schoolId: string ) {
    const body = await req.json()
    const parsedBody = createFeeStructureSchema.safeParse(body)
    if(!parsedBody.success){
      return NextResponse.json(
        { error: "Validation failed", details: parsedBody.error.flatten().fieldErrors},
        { status: 400 }
      )
    }
    const {classId, termId, name, amount, isOptional = false } = parsedBody.data;
    const term = await prisma.term.findFirst({
      where: { id: termId, academicYear: { schoolId } },
      select: { id: true },
    });
    if (!term) {
      return NextResponse.json({ error: 'Term not found for this school.' }, { status: 404 });
    }
    if (classId) {
      const classRecord = await prisma.class.findFirst({ where: { id: classId, schoolId }, select: { id: true } });
      if (!classRecord) {
        return NextResponse.json({ error: 'Class not found for this school.' }, { status: 404 });
      }
    }
 
    const feeStructure = await prisma.feeStructure.create({
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
   return NextResponse.json(
    { data: feeStructure },
    { status: 201 }
   )
  },
 
  async listFeeStructures(schoolId: string, termId: string) {

   const structures = await prisma.feeStructure.findMany({
     where: { schoolId, termId },
     include: { class: { select: { level: true } } },
     orderBy: { name: "asc" },
   });
 
   return NextResponse.json({ data: structures }, { status: 200 })
  },
 
 // ============================================================
 // ASSIGN FEE BALANCES TO CLASS
 // ============================================================
 
 /**
  * Assigns fee balances for all students in a class for a given fee structure.
  * Idempotent: existing balances are not overwritten (use updateFeeBalance for adjustments).
  */
  async assignFeeBalancesToClass(req: NextRequest, schoolId: string, feeStructureId: string) {
    const body = await req.json();
    const parsedBody = assignFeeSchema.safeParse(body)
    if(!parsedBody.success){
      return NextResponse.json(
        { error: "Validation failed", details: parsedBody.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { classId, academicYearId } = parsedBody.data
 
    const [feeStructure, classRecord, academicYear] = await Promise.all([
      prisma.feeStructure.findFirst({
      where:  { id: feeStructureId, schoolId },
      select: { id: true, amount: true, termId: true, classId: true },
      }),
      prisma.class.findFirst({ where: { id: classId, schoolId }, select: { id: true } }),
      prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId }, select: { id: true } }),
    ]);
    if (!feeStructure) {
      return NextResponse.json({ error: 'Fee structure not found.' }, { status: 404 });
    }
    if (!classRecord || !academicYear) {
      return NextResponse.json({ error: 'Class or academic year not found for this school.' }, { status: 404 });
    }
    if (feeStructure.classId && feeStructure.classId !== classId) {
      return NextResponse.json({ error: 'This fee structure is for a different class.' }, { status: 400 });
    }
    const term = await prisma.term.findFirst({
      where: { id: feeStructure.termId, academicYearId },
      select: { id: true },
    });
    if (!term) {
      return NextResponse.json({ error: 'The fee structure term does not belong to the selected academic year.' }, { status: 400 });
    }
 
    const enrollments = await prisma.enrollment.findMany({
      where: { classId, academicYearId },
      select: { studentId: true },
    });
 
   const results = await Promise.all(enrollments.map((e) =>
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
   ));
 
    return NextResponse.json({
      message: `Fee assigned to ${results.length} student(s).`,
      data:    { count: results.length },
    });
  },
 
 // ============================================================
 // RECORD PAYMENT
 // ============================================================
 
  async recordPayment(req: NextRequest, schoolId: string, recordedById: string ) {
   const body = await req.json()
   const parsedBody = recordPaymentSchema.safeParse(body)
   if(!parsedBody.success){
     return NextResponse.json(
       { error: "Vlaidation failed", details: parsedBody.error.flatten().fieldErrors },
       { status: 400 }
     )
   }
   const {
     studentId,
     termId,
     feeStructureId, 
     amount,
     paymentDate,
     paymentMethod,
     note,
   } = parsedBody.data
 
   if (amount <= 0) {
     return NextResponse.json(
       { error: "Amount must be greater than 0"}, { status: 400 }
     )
   }

   const [student, term] = await Promise.all([
     prisma.studentProfile.findFirst({
      where:  { id: studentId, schoolId },
      select: { id: true },
     }),
     prisma.term.findFirst({
       where: { id: termId, academicYear: { schoolId } },
       select: { id: true },
     }),
   ]);
    if (!student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }
    if (!term) {
      return NextResponse.json({ error: 'Term not found for this school.' }, { status: 404 });
    }
    if (feeStructureId) {
      const feeStructure = await prisma.feeStructure.findFirst({
        where: { id: feeStructureId, schoolId, termId },
        select: { id: true, amount: true },
      });
      if (!feeStructure) {
        return NextResponse.json({ error: 'Fee structure not found for this term.' }, { status: 404 });
      }
    }
 
   return prisma.$transaction(async (tx) => {
     // 1. Create payment record
     const payment = await tx.feePayment.create({
       data: {
         studentId, 
         termId,
         feeStructureId: feeStructureId ?? null,
         receiptNumber: generateReceiptNumber(),
         amount,
         paymentDate: new Date(paymentDate),
         paymentMethod,
         recordedById,
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
      } else {
        const feeStructure = await tx.feeStructure.findUnique({
          where: { id: feeStructureId },
          select: { amount: true },
        });
        if (!feeStructure) throw new Error('Fee structure is no longer available.');
        await tx.feeBalance.create({
          data: { studentId, feeStructureId, amountDue: feeStructure.amount, amountPaid: amount },
        });
       }
     }
 
     return NextResponse.json(
       { data: payment }, { status: 200 }
     )
   });
  },

  async listPayments(schoolId: string, termId?: string, search?: string, page = 1, limit = 100) {
    const where = {
      term: { academicYear: { schoolId }, ...(termId ? { id: termId } : {}) },
      ...(search ? {
        student: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { studentNumber: { contains: search, mode: 'insensitive' as const } },
          ],
        },
      } : {}),
    };
    const [payments, total] = await Promise.all([
      prisma.feePayment.findMany({
        where,
        orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
          term: { select: { id: true, period: true, academicYear: { select: { label: true } } } },
        },
      }),
      prisma.feePayment.count({ where }),
    ]);
    return NextResponse.json({ data: payments, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  },

  async updatePayment(req: NextRequest, schoolId: string, paymentId: string) {
    try {
      const body = await req.json();
      const parsed = updateFeePaymentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }
      const payment = await prisma.feePayment.findFirst({
        where: { id: paymentId, student: { schoolId }, term: { academicYear: { schoolId } } },
        select: { id: true, studentId: true, termId: true, feeStructureId: true, amount: true },
      });
      if (!payment) {
        return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
      }

      const { amount, paymentDate, paymentMethod, feeStructureId, note } = parsed.data;
      if (feeStructureId) {
        const feeStructure = await prisma.feeStructure.findFirst({
          where: { id: feeStructureId, schoolId, termId: payment.termId },
          select: { id: true },
        });
        if (!feeStructure) {
          return NextResponse.json({ error: 'Fee structure not found for this payment term.' }, { status: 404 });
        }
      }

      const updated = await prisma.$transaction(async (tx) => {
        if (payment.feeStructureId) {
          const previousBalance = await tx.feeBalance.findUnique({
            where: { studentId_feeStructureId: { studentId: payment.studentId, feeStructureId: payment.feeStructureId } },
            select: { amountPaid: true },
          });
          if (previousBalance && previousBalance.amountPaid < payment.amount) {
            throw new Error('The associated fee balance is inconsistent. The payment cannot be edited safely.');
          }
          if (previousBalance) {
            await tx.feeBalance.update({
              where: { studentId_feeStructureId: { studentId: payment.studentId, feeStructureId: payment.feeStructureId } },
              data: { amountPaid: previousBalance.amountPaid - payment.amount },
            });
          }
        }

        if (feeStructureId) {
          const newBalance = await tx.feeBalance.findUnique({
            where: { studentId_feeStructureId: { studentId: payment.studentId, feeStructureId } },
            select: { amountPaid: true },
          });
          if (newBalance) {
            await tx.feeBalance.update({
              where: { studentId_feeStructureId: { studentId: payment.studentId, feeStructureId } },
              data: { amountPaid: newBalance.amountPaid + amount },
            });
          } else {
            const structure = await tx.feeStructure.findUnique({ where: { id: feeStructureId }, select: { amount: true } });
            if (!structure) throw new Error('The selected fee structure is no longer available.');
            await tx.feeBalance.create({
              data: { studentId: payment.studentId, feeStructureId, amountDue: structure.amount, amountPaid: amount },
            });
          }
        }

        return tx.feePayment.update({
          where: { id: payment.id },
          data: { amount, paymentDate: new Date(paymentDate), paymentMethod, feeStructureId, note },
          include: {
            student: { select: { firstName: true, lastName: true, studentNumber: true } },
            term: { select: { id: true, period: true, academicYear: { select: { label: true } } } },
          },
        });
      });
      return NextResponse.json({ data: updated });
    } catch (error) {
      if (error instanceof Error && error.message.includes('cannot be edited safely')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      console.error('[feeServices.updatePayment]', error);
      return NextResponse.json({ error: 'Unable to update payment.' }, { status: 500 });
    }
  },
 
 // ============================================================
 // QUERIES
 // ============================================================
  async getStudentFeeStatement(schoolId: string, studentId: string, termId: string) {
    const student = await prisma.studentProfile.findFirst({
      where:  { id: studentId, schoolId },
      select: {
        id:            true,
        firstName:     true,
        lastName:      true,
        studentNumber: true,
        enrollments: {
          take:    1,
          orderBy: { enrolledAt: 'desc' },
          select:  { class: { select: { id: true, level: true } } },
        },
      },
    });
    if (!student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }
    const term = await prisma.term.findFirst({
      where: { id: termId, academicYear: { schoolId } },
      select: { id: true },
    });
    if (!term) {
      return NextResponse.json({ error: 'Term not found for this school.' }, { status: 404 });
    }
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
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
          term: { select: { id: true, period: true, academicYear: { select: { label: true } } } },
        },
      }),
   ]);
 
   const totalDue = balances.reduce((s, b) => s + b.amountDue, 0);
   const totalPaid = balances.reduce((s, b) => s + b.amountPaid, 0);
   const outstanding = totalDue - totalPaid;
 
   return NextResponse.json(
     { data: {
       student: {
         id: student.id,
         firstName: student.firstName,
         lastName: student.lastName,
         studentNumber: student.studentNumber,
         currentClass: student.enrollments[0]?.class ?? null,
       },
       balances,
       payments,
       totalDue,
       totalPaid,
       outstanding,
     } },
     { status: 200 },
   );
  },
 
  async getClassFeeOverview(
    schoolId: string,
   classId: string,
   termId: string,
   academicYearId: string
 ) {
  const classRecord = await prisma.class.findFirst({
    where:  { id: classId, schoolId },
      select: { id: true, level: true },
    });
    if (!classRecord) {
      return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
    }
    const [term, academicYear] = await Promise.all([
      prisma.term.findFirst({ where: { id: termId, academicYear: { schoolId } }, select: { id: true, academicYearId: true } }),
      prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId }, select: { id: true } }),
    ]);
    if (!term || !academicYear || term.academicYearId !== academicYearId) {
      return NextResponse.json({ error: 'Term and academic year must belong to this school and match.' }, { status: 400 });
    }
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
 
    const overview =  enrollments.map((e) => {
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
   return NextResponse.json(
    { data: { classLevel: classRecord.level, rows: overview } }, { status: 200 }
   )
  },
 
  async getStudentPaymentHistory(schoolId: string, studentId: string) {
    const student = await prisma.studentProfile.findFirst({
      where:  { id: studentId, schoolId },
      select: { id: true },
    });
    if (!student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }
    const history = await prisma.feePayment.findMany({
      where: { studentId, term: { academicYear: { schoolId } } },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        term: { select: { id: true, period: true, academicYear: { select: { label: true } } } },
      },
      orderBy: { paymentDate: "desc" },
    });
    return NextResponse.json(
      { data: history }, { status: 200 }
    )
  }
}
