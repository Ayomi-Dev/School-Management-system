import { prisma } from "../lib/prisma/client";

export async function assignSubjectsToEnrolledStudents(
  classId: string,
  subjectIds: string[],
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
) {

  // Fetch all students currently enrolled in this class
  const cls = await tx.class.findUnique({
    where: { id: classId },
    select: {
      school: {
        select: {
          academicYears: {
            where: { isCurrent: true }, //active academic years
            select: {
              terms: {
                where: { isCurrent: true },
                select: { id: true },
                take: 1,
              },
            },
            take: 1,
          },
        },
      },
    },
  });

  const activeTerm = cls?.school?.academicYears?.[0]?.terms?.[0];
  if (!activeTerm) return; // no active term, nothing to backfill

  const enrollments = await tx.enrollment.findMany({
    where: { classId },
    select: { studentId: true },
  });

  if (enrollments.length === 0) return;

  await tx.score.createMany({
    data: enrollments.flatMap(({ studentId }) =>
      subjectIds.map((subjectId) => (
        { studentId, subjectId, termId: activeTerm.id }))
      ),
  });
}


