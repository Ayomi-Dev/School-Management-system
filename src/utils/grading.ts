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
 * Resolves grade + remark for a given total score against the school's
 * GradeScale bands. Throws if no school is configured with bands at all
 * (distinct from "score doesn't fall in any band", which can legitimately
 * happen with gappy bands and should just leave grade null rather than
 * erroring out a save).
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
    // No matching band — don't block the save, just leave grade unset so
    // an admin can notice gaps in their GradeScale config and fix them.
    return { grade: null, gradeRemark: null };
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
