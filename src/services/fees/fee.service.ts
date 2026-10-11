import { prisma } from "@/src/lib/prisma/client";
import { PaymentMethod, PaymentStatus } from "@/app/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { assignFeeSchema, createFeeStructureSchema, recordPaymentSchema } from "@/src/validators/feePaymentSchema";
import { error } from "console";

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
 
    const feeStructure = prisma.feeStructure.create({
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
 
    const feeStructure = await prisma.feeStructure.findFirst({
      where:  { id: feeStructureId, schoolId },
      select: { id: true, amount: true },
    });
    if (!feeStructure) {
      return NextResponse.json({ error: 'Fee structure not found.' }, { status: 404 });
    }
 
    const enrollments = await prisma.enrollment.findMany({
      where: { classId, academicYearId },
      select: { studentId: true },
    });
 
   const results = enrollments.map((e) =>
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
 
    return NextResponse.json({
      message: `Fee assigned to ${results.length} student(s).`,
      data:    { count: results.length },
    });
  },
 
 // ============================================================
 // RECORD PAYMENT
 // ============================================================
 
  async recordPayment(req: NextRequest, schoolId: string ) {
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
     recordedById,
     note,
   } = parsedBody.data
 
   if (amount <= 0) {
     return NextResponse.json(
       { error: "Amount must be greater than 0"}, { status: 400 }
     )
   }

   const student = await prisma.studentProfile.findFirst({
      where:  { id: studentId, schoolId },
      select: { id: true },
    });
    if (!student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
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
 
     return NextResponse.json(
       { data: payment }, { status: 200 }
     )
   });
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
 
   return NextResponse.json(
     { balances, payments, totalDue, totalPaid, outstanding }, { status: 200 }
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
    { data: overview }, { status: 200 }
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
    const history =  prisma.feePayment.findMany({
      where: { studentId },
      include: {
        term: { select: { period: true, academicYearId: true } },
      },
      orderBy: { paymentDate: "desc" },
    });
    return NextResponse.json(
      { data: history }, { status: 200 }
    )
  }
}