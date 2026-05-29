import { prisma } from "@/src/lib/prisma/client";
import { ReportCardStatus } from "@/app/generated/prisma/enums";
import { scoreServices  } from "@/src/services/scores/scores.service";

// ============================================================
// TYPES
// ============================================================

export interface GenerateReportCardInput {
  studentId: string;
  termId: string;
  academicYearId: string;
  teacherRemark?: string;
  principalRemark?: string;
}

export interface UpdateReportCardInput {
  teacherRemark?: string;
  principalRemark?: string;
  pdfUrl?: string;
}

// ============================================================
// GENERATE / UPSERT REPORT CARD
// ============================================================

/**
 * Generates (or refreshes) a report card for a student for a given term.
 * Calculates totals, averages, and position from published scores.
 */

export const reportCardServices = {

    async generateReportCard(input: GenerateReportCardInput) {
      const { studentId, termId, academicYearId, teacherRemark, principalRemark } = input;
    
      // Fetch published scores for this student + term
      const scores = await prisma.score.findMany({
        where: { studentId, termId, isPublished: true },
        include: { subject: { select: { name: true, code: true } } },
      });
    
      if (scores.length === 0) {
        throw new Error(
          "No published scores found for this student/term. Publish scores before generating a report card."
        );
      }
    
      const totalScore = scores.reduce((sum, s) => sum + (s.totalScore ?? 0), 0);
      const averageScore =
        Math.round((totalScore / scores.length) * 10) / 10;
    
      // Get current class enrollment for snapshot
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_academicYearId: { studentId, academicYearId } },
        include: { class: { select: { name: true, level: true } } },
      });
    
      const classSnapshot = enrollment
        ? `${enrollment.class.name} (${enrollment.class.level})`
        : null;
    
      // Compute class rankings to derive position
      let position: number | null = null;
      if (enrollment) {
        try {
          const rankings = await scoreServices.computeClassRankings(enrollment.classId, termId);
          const studentRank = rankings.find((r) => r.studentId === studentId);
          position = studentRank?.position ?? null;
        } catch {
          // Rankings are best-effort; don't fail report card generation
          position = null;
        }
      }
    
      return prisma.reportCard.upsert({
        where: { studentId_termId: { studentId, termId } },
        update: {
          totalScore,
          average: averageScore,
          position,
          classSnapshot,
          teacherRemark: teacherRemark ?? undefined,
          principalRemark: principalRemark ?? undefined,
          status: ReportCardStatus.DRAFT,
        },
        create: {
          studentId,
          termId,
          academicYearId,
          totalScore,
          average: averageScore,
          position,
          classSnapshot,
          teacherRemark: teacherRemark ?? null,
          principalRemark: principalRemark ?? null,
          status: ReportCardStatus.DRAFT,
        },
        include: {
          student: { select: { firstName: true, lastName: true, studentNumber: true, gender: true } },
          term: { select: { period: true, startDate: true, endDate: true } },
          academicYear: { select: { label: true } },
        },
      });
    },
    
    /**
     * Bulk-generate report cards for all students in a class for a given term.
     */
    async bulkGenerateReportCards(
      classId: string,
      termId: string,
      academicYearId: string
    ) {
      const enrollments = await prisma.enrollment.findMany({
        where: { classId, academicYearId },
        select: { studentId: true },
      });
    
      const results = await Promise.allSettled(
        enrollments.map((e) =>
          this.generateReportCard({ studentId: e.studentId, termId, academicYearId })
        )
      );
    
      const succeeded = results
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof this.generateReportCard>>> => r.status === "fulfilled")
        .map((r) => r.value);
    
      const failed = results
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .map((r) => r.reason?.message ?? "Unknown error");
    
      return { succeeded, failed, total: enrollments.length };
    },
    
    // ============================================================
    // PUBLISH REPORT CARD
    // ============================================================
    
    async publishReportCard(reportCardId: string) {
      const rc = await prisma.reportCard.findUniqueOrThrow({
        where: { id: reportCardId },
      });
      if (rc.status === ReportCardStatus.PUBLISHED) {
        throw new Error("Report card is already published.");
      }
      return prisma.reportCard.update({
        where: { id: reportCardId },
        data: { status: ReportCardStatus.PUBLISHED, publishedAt: new Date() },
      });
    },
    
    async bulkPublishReportCards(classId: string, termId: string, academicYearId: string) {
      const enrollments = await prisma.enrollment.findMany({
        where: { classId, academicYearId },
        select: { studentId: true },
      });
      const studentIds = enrollments.map((e) => e.studentId);
    
      return prisma.reportCard.updateMany({
        where: {
          studentId: { in: studentIds },
          termId,
          status: ReportCardStatus.DRAFT,
        },
        data: {
          status: ReportCardStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });
    },
    
    async unpublishReportCard(reportCardId: string) {
      return prisma.reportCard.update({
        where: { id: reportCardId },
        data: { status: ReportCardStatus.DRAFT, publishedAt: null },
      });
    },
    
    // ============================================================
    // UPDATE REPORT CARD
    // ============================================================
    
    async updateReportCard(
      reportCardId: string,
      input: UpdateReportCardInput
    ) {
      const rc = await prisma.reportCard.findUniqueOrThrow({ where: { id: reportCardId } });
      if (rc.status === ReportCardStatus.PUBLISHED) {
        throw new Error(
          "Cannot edit a published report card. Unpublish it first."
        );
      }
      return prisma.reportCard.update({
        where: { id: reportCardId },
        data: input,
        include: {
          student: { select: { firstName: true, lastName: true, studentNumber: true } },
          term: { select: { period: true } },
          academicYear: { select: { label: true } },
        },
      });
    },
    
    // ============================================================
    // QUERIES
    // ============================================================
    
    async getReportCard(studentId: string, termId: string) {
      const rc = await prisma.reportCard.findUnique({
        where: { studentId_termId: { studentId, termId } },
        include: {
          student: {
            include: {
              enrollments: {
                include: { class: true },
                orderBy: { enrolledAt: "desc" },
                take: 1,
              },
              guardians: {
                include: { guardian: { select: { firstName: true, lastName: true, phone: true } } },
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          term: { select: { period: true, startDate: true, endDate: true } },
          academicYear: { select: { label: true } },
        },
      });
    
      if (!rc) return null;
    
      // Attach scores
      const scores = await prisma.score.findMany({
        where: { studentId, termId, isPublished: true },
        include: { subject: { select: { name: true, code: true } } },
        orderBy: { subject: { name: "asc" } },
      });
    
      // Attach attendance summary
      const attendance = await prisma.attendance.groupBy({
        by: ["status"],
        where: {
          studentId,
          session: { termId },
        },
        _count: { status: true },
      });
    
      const attendanceSummary = {
        present: attendance.find((a) => a.status === "PRESENT")?._count.status ?? 0,
        absent:  attendance.find((a) => a.status === "ABSENT")?._count.status  ?? 0,
        late:    attendance.find((a) => a.status === "LATE")?._count.status    ?? 0,
      };
    
      return { ...rc, scores, attendanceSummary };
    },
    
    async listReportCardsByClass(
      classId: string,
      termId: string,
      academicYearId: string
    ) {
      const enrollments = await prisma.enrollment.findMany({
        where: { classId, academicYearId },
        select: { studentId: true },
      });
      const studentIds = enrollments.map((e) => e.studentId);
    
      return prisma.reportCard.findMany({
        where: { studentId: { in: studentIds }, termId },
        include: {
          student: {
            select: { firstName: true, lastName: true, studentNumber: true, gender: true },
          },
        },
        orderBy: { position: "asc" },
      });
    },
    
    async getStudentAllReportCards(studentId: string) {
      return prisma.reportCard.findMany({
        where: { studentId },
        include: {
          term: { select: { period: true } },
          academicYear: { select: { label: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }
}