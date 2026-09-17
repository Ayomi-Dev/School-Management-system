import { prisma } from "@/src/lib/prisma/client";
import { resolveBursarAndAdminAccess } from "@/src/utils/resolvers";
import { assignFeeSchema, createFeeStructureSchema, recordPaymentSchema } from "@/src/validators/feePaymentSchema";
import { NextRequest, NextResponse } from "next/server";
import { assignFeeBalancesToClass, createFeeStructure, getClassFeeOverview, getStudentFeeStatement, getStudentPaymentHistory, listFeeStructures, recordPayment } from "../fees/fee.service";

export const bursarService = {
  async getBursarById(bursarId: string, schoolId: string) {
    console.log("route called with bursarId:", bursarId, "schoolId:", schoolId);
    try {
       const bursar = await prisma.user.findFirst(
        {
          where: { id: bursarId, schoolId, role: 'BURSAR' },  
          select: { id: true, role: true, email: true, firstName: true, lastName: true, schoolId: true }
        }
       )
       if(!bursar){
        return NextResponse.json({ error: 'Bursar not found.' }, { status: 404 });
       }
        return NextResponse.json({ data: bursar }, { status: 200 });
    } catch (error) {
        console.error('[bursarService.getBursarById]', error);
        return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
  // ───────────────────────────────────────────────────────────────────────────
  // GET /bursar/dashboard
  //
  // School-wide summary for the current term: totals, recent payments, and
  // a per-class breakdown. Scoped to the bursar's own school.
  // ───────────────────────────────────────────────────────────────────────────
  async getDashboardSummary(schoolId: string, userId: string, termId: string) {
    try {
        const access = await resolveBursarAndAdminAccess(userId, schoolId)
        if(!access){
            return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
        }
        
      // Pull all fee balances for this school and term in one query
        const [balances, recentPayments, classes] = await Promise.all([
            prisma.feeBalance.findMany({
              where: { feeStructure: { schoolId, termId } },
              select: {
                amountDue:  true,
                amountPaid: true,
                student: {
                  select: {
                    enrollments: {
                      take: 1,
                      orderBy: { enrolledAt: 'desc' },
                      select: { classId: true },
                    },
                  },
                },
              },
            }),
 
            prisma.feePayment.findMany({
              where:   { term: { id: termId }, student: { schoolId } },
              take:    10,
              orderBy: { paymentDate: 'desc' },
              select: {
                id:            true,
                receiptNumber: true,
                amount:        true,
                paymentDate:   true,
                paymentMethod: true,
                student: { select: { firstName: true, lastName: true, studentNumber: true } },
                term:    { select: { period: true } },
              },
            }),
        
            prisma.class.findMany({
              where:  { schoolId },
              select: { id: true, level: true },
            }),
        ]);
 
        const totalCollected   = balances.reduce((s, b) => s + b.amountPaid,  0);
        const totalDue         = balances.reduce((s, b) => s + b.amountDue,   0);
        const totalOutstanding = totalDue - totalCollected;
        const totalStudents    = new Set(balances.map((b) => b.student)).size;
        
        // Group balances by class for the breakdown
        const classCollected   = new Map<string, number>();
        const classOutstanding = new Map<string, number>();
        const classTotal       = new Map<string, number>();
        
        for (const b of balances) {
          const cId = b.student.enrollments[0]?.classId ?? '__unknown';
          classCollected.set(cId,   (classCollected.get(cId)   ?? 0) + b.amountPaid);
          classOutstanding.set(cId, (classOutstanding.get(cId) ?? 0) + (b.amountDue - b.amountPaid));
          classTotal.set(cId,       (classTotal.get(cId)       ?? 0) + b.amountDue);
        }
 
        const classBreakdown = classes
          .map((c) => ({
            classId:     c.id,
            level:       c.level,
            collected:   classCollected.get(c.id)   ?? 0,
            outstanding: classOutstanding.get(c.id) ?? 0,
            total:       classTotal.get(c.id)       ?? 0,
          }))
          .filter((c) => c.total > 0)
          .sort((a, b) => b.outstanding - a.outstanding);
        
        return NextResponse.json({
          data: {
            totalCollected,
            totalOutstanding,
            totalDue,
            totalStudents,
            clearedCount:  balances.filter((b) => b.amountDue - b.amountPaid <= 0).length,
            pendingCount:  balances.filter((b) => b.amountDue - b.amountPaid >  0).length,
            recentPayments,
            classBreakdown,
          },
        });
    } 
    catch (error) {
      console.error('[bursarService.getDashboardSummary]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
 
  // ───────────────────────────────────────────────────────────────────────────
  // GET /bursar/fee-structures?termId=
  // ───────────────────────────────────────────────────────────────────────────
  async listFeeStructures(userId: string, schoolId: string, termId: string) {
    try {
      const access = await resolveBursarAndAdminAccess(userId, schoolId)
        if(!access){
            return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
        }
      const structures = await listFeeStructures(schoolId, termId);
      return NextResponse.json({ data: structures });
    } catch (error) {
      console.error('[bursarService.listFeeStructures]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
 
  // ───────────────────────────────────────────────────────────────────────────
  // POST /bursar/fee-structures
  // ───────────────────────────────────────────────────────────────────────────
  async createFeeStructure(req: NextRequest, userId: string, schoolId: string) {
    try {
      const access = await resolveBursarAndAdminAccess(userId, schoolId)
        if(!access){
            return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
        }
 
      const body   = await req.json();
      const parsed = createFeeStructureSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }
 
      const structure = await createFeeStructure({ schoolId, ...parsed.data });
      return NextResponse.json({ message: 'Fee structure created.', data: structure }, { status: 201 });
    } catch (error) {
      console.error('[bursarService.createFeeStructure]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
 
  // ───────────────────────────────────────────────────────────────────────────
  // POST /bursar/fee-structures/:feeStructureId/assign
  // ───────────────────────────────────────────────────────────────────────────
  async assignFeeToClass(req: NextRequest, userId: string, schoolId: string, feeStructureId: string) {
    try {
      const access = await resolveBursarAndAdminAccess(userId, schoolId)
        if(!access){
            return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
        }
 
      // Verify the fee structure belongs to this school
      const structure = await prisma.feeStructure.findFirst({
        where:  { id: feeStructureId, schoolId },
        select: { id: true },
      });
      if (!structure) {
        return NextResponse.json({ error: 'Fee structure not found.' }, { status: 404 });
      }
 
      const body   = await req.json();
      const parsed = assignFeeSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }
 
      const results = await assignFeeBalancesToClass({ feeStructureId, ...parsed.data });
      return NextResponse.json({
        message: `Fee assigned to ${results.length} student(s).`,
        data:    { count: results.length },
      });
    } catch (error) {
      console.error('[bursarService.assignFeeToClass]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
 
  // ───────────────────────────────────────────────────────────────────────────
  // POST /bursar/payments
  // ───────────────────────────────────────────────────────────────────────────
  async recordPayment(req: NextRequest, userId: string, schoolId: string) {
    try {
      const access = await resolveBursarAndAdminAccess(userId, schoolId)
        if(!access){
            return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
        }
 
      const body   = await req.json();
      const parsed = recordPaymentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }
 
      // Verify the student belongs to this school
      const student = await prisma.studentProfile.findFirst({
        where:  { id: parsed.data.studentId, schoolId },
        select: { id: true },
      });
      if (!student) {
        return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
      }
 
      // Resolve the bursar's profile id so it is stamped as recordedById
      const bursarProfile = await prisma.user.findUnique({
        where:  { id: userId },
        select: { id: true, role: true },
      });
 
      const payment = await recordPayment({
        ...parsed.data,
        paymentDate:  new Date(parsed.data.paymentDate),
        recordedById: bursarProfile?.id ?? undefined,
      });
 
      return NextResponse.json({ message: 'Payment recorded.', data: payment }, { status: 201 });
    } catch (error: any) {
      console.error('[bursarService.recordPayment]', error);
      if (error?.message === 'Payment amount must be greater than 0.') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
 
  // ───────────────────────────────────────────────────────────────────────────
  // GET /bursar/students/:studentId/statement?termId=
  // ───────────────────────────────────────────────────────────────────────────
  async getStudentStatement(userId: string, schoolId: string, studentId: string, termId: string) {
    try {
      const access = await resolveBursarAndAdminAccess(userId, schoolId)
        if(!access){
            return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
        }
 
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
 
      const statement = await getStudentFeeStatement(studentId, termId);
      return NextResponse.json({
        data: {
          student: {
            id:            student.id,
            firstName:     student.firstName,
            lastName:      student.lastName,
            studentNumber: student.studentNumber,
            currentClass:  student.enrollments[0]?.class ?? null,
          },
          ...statement,
        },
      });
    } catch (error) {
      console.error('[bursarService.getStudentStatement]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
 
  // ───────────────────────────────────────────────────────────────────────────
  // GET /bursar/students/:studentId/payment-history
  // ───────────────────────────────────────────────────────────────────────────
  async getStudentPaymentHistory(userId: string, schoolId: string, studentId: string) {
    try {
      const access = await resolveBursarAndAdminAccess(userId, schoolId)
        if(!access){
            return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
        }
 
      const student = await prisma.studentProfile.findFirst({
        where:  { id: studentId, schoolId },
        select: { id: true },
      });
      if (!student) {
        return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
      }
 
      const history = await getStudentPaymentHistory(studentId);
      return NextResponse.json({ data: history });
    } catch (error) {
      console.error('[bursarService.getStudentPaymentHistory]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
 
  // ───────────────────────────────────────────────────────────────────────────
  // GET /bursar/classes/:classId/fee-overview?termId=&academicYearId=
  // ───────────────────────────────────────────────────────────────────────────
  async getClassFeeOverview(
    userId:  string,
    schoolId: string,
    classId:       string,
    termId:        string,
    academicYearId: string,
  ) {
    try {
      const access = await resolveBursarAndAdminAccess(userId, schoolId)
        if(!access){
            return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
        }
 
      const classRecord = await prisma.class.findFirst({
        where:  { id: classId, schoolId },
        select: { id: true, level: true },
      });
      if (!classRecord) {
        return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
      }
 
      const overview = await getClassFeeOverview(classId, termId, academicYearId);
      return NextResponse.json({
        data: { classLevel: classRecord.level, rows: overview },
      });
    } catch (error) {
      console.error('[bursarService.getClassFeeOverview]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
};