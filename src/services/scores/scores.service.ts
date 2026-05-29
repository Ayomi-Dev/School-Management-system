import { prisma } from "@/src/lib/prisma/client";

// ============================================================
// GRADE CONFIGURATION
// ============================================================

export interface GradeConfig {
  min: number;
  max: number;
  grade: string;
  remark: string;
}

export const DEFAULT_GRADE_SCALE: GradeConfig[] = [
  { min: 75, max: 100, grade: "A",  remark: "Excellent" },
  { min: 65, max: 74,  grade: "B",  remark: "Very Good" },
  { min: 55, max: 64,  grade: "C",  remark: "Good" },
  { min: 45, max: 54,  grade: "D",  remark: "Pass" },
  { min: 40, max: 44,  grade: "E",  remark: "Below Average" },
  { min: 0,  max: 39,  grade: "F",  remark: "Fail" },
];

export interface UpsertScoreInput {
    studentId: string;     // StudentProfile.id
    subjectId: string;
    termId: string;
    enteredById: string;   // TeacherProfile.id
    caScore?: number;
    examScore?: number;
    gradeScale?: GradeConfig[];
}
    
export interface BulkUpsertScoreInput {
  subjectId: string;
  termId: string;
  classId: string;
  enteredById: string;
  records: {
    studentId: string;
    caScore?: number;
    examScore?: number;
  }[];
  gradeScale?: GradeConfig[];
}

export interface StudentRanking {
    studentId: string;
    name: string;
    studentNumber: string;
    totalScore: number;
    averageScore: number;
    position: number;
    subjectCount: number;
}




export const scoreServices = {
    computeGrade(
      total: number,
      scale: GradeConfig[] = DEFAULT_GRADE_SCALE
    ): { grade: string; remark: string } {
      for (const config of scale) {
        if (total >= config.min && total <= config.max) {
          return { grade: config.grade, remark: config.remark };
        }
      }
      return { grade: "F", remark: "Fail" };
    },
    
    // ============================================================
    // SCORE UPSERT ---- creating and udating scores
    // ============================================================
    
    async upsertScore(input: UpsertScoreInput) {
      const { studentId, subjectId, termId, enteredById, caScore, examScore, gradeScale } = input;
    
      // Validate bounds
      if (caScore !== undefined && (caScore < 0 || caScore > 40)) {
        throw new Error("CA score must be between 0 and 40.");
      }
      if (examScore !== undefined && (examScore < 0 || examScore > 60)) {
        throw new Error("Exam score must be between 0 and 60.");
      }
    
      const totalScore =
        caScore !== undefined && examScore !== undefined
          ? caScore + examScore
          : caScore !== undefined
          ? caScore
          : examScore !== undefined
          ? examScore
          : null;
    
      const { grade, remark } =
        totalScore !== null ? this.computeGrade(totalScore, gradeScale) : { grade: null, remark: null };
    
      return prisma.score.upsert({
        where: { studentId_subjectId_termId: { studentId, subjectId, termId } },
        update: {
          caScore: caScore ?? undefined,
          examScore: examScore ?? undefined,
          totalScore: totalScore ?? undefined,
          grade: grade ?? undefined,
          gradeRemark: remark ?? undefined,
          enteredById,
        },
        create: {
          studentId,
          subjectId,
          termId,
          enteredById,
          caScore: caScore ?? null,
          examScore: examScore ?? null,
          totalScore: totalScore ?? null,
          grade: grade ?? null,
          gradeRemark: remark ?? null,
          isPublished: false,
        },
        include: {
          student: { select: { firstName: true, lastName: true, studentNumber: true } },
          subject: { select: { name: true } },
        },
      });
    },
    
    /**
     * Bulk upsert scores for a whole class in one subject/term.
     * Validates teacher is assigned to this subject/class/term.
     */
    async bulkUpsertScores(input: BulkUpsertScoreInput) {
      const { subjectId, termId, classId, enteredById, records, gradeScale } = input;
    
      // Verify teacher assignment
      const assignment = await prisma.subjectTeacher.findFirst({
        where: { teacherId: enteredById, subjectId, classId, termId },
      });
      if (!assignment) {
        throw new Error(
          "You are not assigned to teach this subject for this class and term."
        );
      }
    
      const upserts = records.map((r) =>
        this.upsertScore({
          studentId: r.studentId,
          subjectId,
          termId,
          enteredById,
          caScore: r.caScore,
          examScore: r.examScore,
          gradeScale,
        })
      );
    
      return Promise.all(upserts);
    },
    
    // ============================================================
    // PUBLISH / UNPUBLISH SCORES
    // ============================================================
    
    async publishScores(subjectId: string, termId: string) {
      return prisma.score.updateMany({
        where: { subjectId, termId, isPublished: false },
        data: { isPublished: true, publishedAt: new Date() },
      });
    },
    
    async unpublishScores(subjectId: string, termId: string) {
      return prisma.score.updateMany({
        where: { subjectId, termId, isPublished: true },
        data: { isPublished: false, publishedAt: null },
      });
    },
    
    // ============================================================
    // SCORE QUERIES
    // ============================================================
    
    async getStudentScoresByTerm(
      studentId: string,
      termId: string,
      onlyPublished = false
    ) {
      return prisma.score.findMany({
        where: {
          studentId,
          termId,
          ...(onlyPublished ? { isPublished: true } : {}),
        },
        include: {
          subject: { select: { name: true, code: true } },
          enteredBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { subject: { name: "asc" } },
      });
    },
    
    async getClassScoresBySubjectAndTerm(
      classId: string,
      subjectId: string,
      termId: string
    ) {
      // Get all enrolled students for this class
      const enrollments = await prisma.enrollment.findMany({
        where: { classId, academicYear: { terms: { some: { id: termId } } } },
        select: { studentId: true },
      });
      const studentIds = enrollments.map((e) => e.studentId);
    
      return prisma.score.findMany({
        where: { studentId: { in: studentIds }, subjectId, termId },
        include: {
          student: { select: { firstName: true, lastName: true, studentNumber: true } },
        },
        orderBy: { totalScore: "desc" },
      });
    },
    
    // ============================================================
    // CLASS RANKINGS
    // ============================================================
    
    async computeClassRankings(
      classId: string,
      termId: string
    ): Promise<StudentRanking[]> {
      const enrollments = await prisma.enrollment.findMany({
        where: { classId, academicYear: { terms: { some: { id: termId } } } },
        include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
      });
    
      const studentIds = enrollments.map((e) => e.studentId);
    
      const scores = await prisma.score.findMany({
        where: { studentId: { in: studentIds }, termId, isPublished: true },
        select: { studentId: true, totalScore: true },
      });
    
      // Aggregate by student
      const aggregates = new Map<string, { total: number; count: number }>();
      for (const score of scores) {
        if (!aggregates.has(score.studentId)) {
          aggregates.set(score.studentId, { total: 0, count: 0 });
        }
        const agg = aggregates.get(score.studentId)!;
        agg.total += score.totalScore ?? 0;
        agg.count++;
      }
    
      // Build ranking list
      const studentInfo = new Map(
        enrollments.map((e) => [
          e.studentId,
          {
            name: `${e.student.firstName} ${e.student.lastName}`,
            studentNumber: e.student.studentNumber,
          },
        ])
      );
    
      const rankings: Omit<StudentRanking, "position">[] = studentIds.map((id) => {
        const agg = aggregates.get(id) ?? { total: 0, count: 0 };
        return {
          studentId: id,
          name: studentInfo.get(id)?.name ?? "Unknown",
          studentNumber: studentInfo.get(id)?.studentNumber ?? "",
          totalScore: agg.total,
          averageScore: agg.count > 0 ? Math.round((agg.total / agg.count) * 10) / 10 : 0,
          subjectCount: agg.count,
        };
      });
    
      rankings.sort((a, b) => b.totalScore - a.totalScore);
    
      return rankings.map((r, idx) => ({ ...r, position: idx + 1 }));
    }
}