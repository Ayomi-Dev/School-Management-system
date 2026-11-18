// Shared by both the CA and Exam save endpoints, since either one can
// trigger a recompute of totalScore/grade (whichever was just saved, plus
// whatever the other column already holds).
 
import { prisma } from '@/src//lib/prisma/client';
 
export class GradingConfigError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Resolves a school's CA/Exam max scores. Falls back to 40/60 defaults if
 * no AssessmentConfig row exists yet (e.g. school hasn't configured one) —
 * matches "hardcode CA max 40 / Exam max 60 for now, configurable later".
 */
export async function resolveAssessmentConfig(schoolId: string) {
  const config = await prisma.assessmentConfig.findUnique({
    where: { schoolId },
    select: { caMaxScore: true, examMaxScore: true },
  });
 
  return {
    caMaxScore: config?.caMaxScore ?? 40,
    examMaxScore: config?.examMaxScore ?? 60,
  };
}

/**
 * Resolves grade + remark against the school's GradeScale bands, then falls
 * back to the application's default A–F bands when no custom band matches.
 */
export async function resolveGrade(
  schoolId: string,
  totalScore: number,
): Promise<{ grade: string | null; gradeRemark: string | null }> {
  const band = await prisma.gradeScale.findFirst({
    where: {
      schoolId,
      minScore: { lte: totalScore },
      maxScore: { gte: totalScore },
    },
    select: { grade: true, remark: true },
  });
 
  if (!band) {
    // Keep score records gradeable for older schools without configured bands
    // and for gaps in a custom scale, matching the application's default A–F scale.
    if (totalScore >= 75) return { grade: 'A', gradeRemark: 'Excellent' };
    if (totalScore >= 65) return { grade: 'B', gradeRemark: 'Very Good' };
    if (totalScore >= 55) return { grade: 'C', gradeRemark: 'Good' };
    if (totalScore >= 45) return { grade: 'D', gradeRemark: 'Pass' };
    if (totalScore >= 40) return { grade: 'E', gradeRemark: 'Below Average' };
    return { grade: 'F', gradeRemark: 'Fail' };
  }
 
  return { grade: band.grade, gradeRemark: band.remark ?? null };
}
 
/**
 * Given the post-save caScore/examScore for a Score row, computes the new
 * totalScore and resolves its grade. Returns null totalScore (and null
 * grade) if either component is still missing — a score isn't "complete"
 * until both CA and Exam are entered.
 */
export async function computeTotalAndGrade(
  schoolId: string,
  caScore: number | null,
  examScore: number | null,
) {
  if (caScore == null || examScore == null) {
    return { totalScore: null, grade: null, gradeRemark: null };
  }
 
  const totalScore = caScore + examScore;
  const { grade, gradeRemark } = await resolveGrade(schoolId, totalScore);
  return { totalScore, grade, gradeRemark };
}
