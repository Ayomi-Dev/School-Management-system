import { prisma } from "@/src/lib/prisma/client";
import { resolveBursarAndAdminAccess } from "@/src/utils/resolvers";
import { assignFeeSchema, createFeeStructureSchema, recordPaymentSchema } from "@/src/validators/feePaymentSchema";
import { NextRequest, NextResponse } from "next/server";
import { feeServices } from "../fees/fee.service";

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
      const structures = await feeServices.listFeeStructures(schoolId, termId);
      return NextResponse.json({ data: structures });
    } catch (error) {
      console.error('[bursarService.listFeeStructures]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
 
  // ───────────────────────────────────────────────────────────────────────────
  // POST /bursar/fee-structures
  // ───────────────────────────────────────────────────────────────────────────

 
  // ───────────────────────────────────────────────────────────────────────────
  // POST /bursar/fee-structures/:feeStructureId/assign
  // ───────────────────────────────────────────────────────────────────────────

 
  // ───────────────────────────────────────────────────────────────────────────
  // POST /bursar/payments
  // ───────────────────────────────────────────────────────────────────────────
 
 
  // ───────────────────────────────────────────────────────────────────────────
  // GET /bursar/students/:studentId/statement?termId=
  // ───────────────────────────────────────────────────────────────────────────
  
  // ───────────────────────────────────────────────────────────────────────────
  // GET /bursar/students/:studentId/payment-history
  // ───────────────────────────────────────────────────────────────────────────
  
 
  // ───────────────────────────────────────────────────────────────────────────
  // GET /bursar/classes/:classId/fee-overview?termId=&academicYearId=
  // ───────────────────────────────────────────────────────────────────────────
  
};