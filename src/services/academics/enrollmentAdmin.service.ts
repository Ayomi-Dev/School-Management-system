import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma/client";
import { _levelOrder } from "@/src/utils/levelOrder";
import {
  enrollmentPromotionQuerySchema,
  promoteStudentsSchema,
} from "@/src/validators/enrollmentSchema";

class EnrollmentPromotionError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "EnrollmentPromotionError";
  }
}

export const enrollmentAdminService = {
  async getPromotionData(req: NextRequest, schoolId: string) {
    try {
      const parsedQuery = enrollmentPromotionQuerySchema.safeParse(
        Object.fromEntries(req.nextUrl.searchParams.entries()),
      );
      if (!parsedQuery.success) {
        return NextResponse.json(
          { error: "Invalid query parameters.", details: parsedQuery.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const { sourceAcademicYearId, sourceClassId, targetAcademicYearId, search, page, limit } = parsedQuery.data;
      const [academicYears, classes] = await Promise.all([
        prisma.academicYear.findMany({
          where: { schoolId },
          orderBy: [{ startDate: "desc" }, { label: "desc" }],
          select: { id: true, label: true, startDate: true, endDate: true, isCurrent: true },
        }),
        prisma.class.findMany({
          where: { schoolId },
          orderBy: [{ order: "asc" }, { level: "asc" }],
          select: { id: true, level: true, order: true },
        }),
      ]);

      const sourceYear = sourceAcademicYearId
        ? academicYears.find((year) => year.id === sourceAcademicYearId) ?? null
        : academicYears.find((year) => year.isCurrent) ?? academicYears[0] ?? null;
      if (sourceAcademicYearId && !sourceYear) {
        return NextResponse.json({ error: "Source academic year not found for this school." }, { status: 404 });
      }

      const targetYear = targetAcademicYearId
        ? academicYears.find((year) => year.id === targetAcademicYearId) ?? null
        : academicYears
            .filter((year) => sourceYear && year.startDate > sourceYear.startDate)
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0] ?? null;
      if (targetAcademicYearId && !targetYear) {
        return NextResponse.json({ error: "Target academic year not found for this school." }, { status: 404 });
      }
      if (sourceYear && targetYear && targetYear.startDate <= sourceYear.startDate) {
        return NextResponse.json({ error: "Choose a target academic year that starts after the source year." }, { status: 400 });
      }

      const sourceClass = sourceClassId
        ? classes.find((classItem) => classItem.id === sourceClassId) ?? null
        : null;
      if (sourceClassId && !sourceClass) {
        return NextResponse.json({ error: "Source class not found for this school." }, { status: 404 });
      }

      const classEnrollmentCounts: Record<string, number> = {};
      if (sourceYear && classes.length) {
        const counts = await Promise.all(classes.map(async (classItem) => {
          const count = await prisma.enrollment.count({
            where: {
              academicYearId: sourceYear.id,
              classId: classItem.id,
              student: {
                schoolId,
                status: "ACTIVE",
                OR: [
                  { deletedAt: null },
                  { deletedAt: { isSet: false } },
                ],
              },
            },
          });
          return [classItem.id, count] as const;
        }));
        for (const [classId, count] of counts) classEnrollmentCounts[classId] = count;
      }

      let candidates: Array<{
        id: string;
        studentId: string;
        student: {
          firstName: string;
          lastName: string;
          studentNumber: string;
          enrollments: Array<{ classId: string; class: { level: string } }>;
        };
      }> = [];
      let total = 0;

      if (sourceYear && sourceClass && targetYear) {
        const where = {
          academicYearId: sourceYear.id,
          classId: sourceClass.id,
          class: { schoolId },
          student: {
            schoolId,
            status: "ACTIVE" as const,
            AND: [
              {
                OR: [
                  { deletedAt: null },
                  { deletedAt: { isSet: false } },
                ],
              },
              ...(search ? [{
                OR: [
                  { firstName: { contains: search, mode: "insensitive" as const } },
                  { lastName: { contains: search, mode: "insensitive" as const } },
                  { studentNumber: { contains: search, mode: "insensitive" as const } },
                ],
              }] : []),
            ],
          },
        };
        [total, candidates] = await Promise.all([
          prisma.enrollment.count({ where }),
          prisma.enrollment.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
            select: {
              id: true,
              studentId: true,
              student: {
                select: {
                  firstName: true,
                  lastName: true,
                  studentNumber: true,
                  enrollments: {
                    where: { academicYearId: targetYear.id },
                    take: 1,
                    select: { classId: true, class: { select: { level: true } } },
                  },
                },
              },
            },
          }),
        ]);
      }

      return NextResponse.json({
        data: {
          academicYears: academicYears.map((year) => ({
            id: year.id,
            label: year.label,
            startDate: year.startDate.toISOString(),
            endDate: year.endDate.toISOString(),
            isCurrent: year.isCurrent,
          })),
          classes,
          classEnrollmentCounts,
          selectedSourceAcademicYearId: sourceYear?.id ?? null,
          selectedTargetAcademicYearId: targetYear?.id ?? null,
          selectedSourceClassId: sourceClass?.id ?? null,
          candidates: candidates.map((enrollment) => ({
            enrollmentId: enrollment.id,
            studentId: enrollment.studentId,
            firstName: enrollment.student.firstName,
            lastName: enrollment.student.lastName,
            studentNumber: enrollment.student.studentNumber,
            targetEnrollment: enrollment.student.enrollments[0]
              ? {
                  classId: enrollment.student.enrollments[0].classId,
                  classLevel: enrollment.student.enrollments[0].class.level,
                }
              : null,
          })),
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("[enrollmentAdminService.getPromotionData]", error);
      return NextResponse.json({ error: "Unable to load enrollment data." }, { status: 500 });
    }
  },

  async promoteStudents(req: NextRequest, schoolId: string) {
    try {
      const body = await req.json();
      const parsed = promoteStudentsSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed.", details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const { studentIds, sourceAcademicYearId, sourceClassId, targetAcademicYearId, targetClassId } = parsed.data;
      const promotion = await prisma.$transaction(async (tx) => {
        const [sourceYear, targetYear, sourceClass, targetClass] = await Promise.all([
          tx.academicYear.findFirst({ where: { id: sourceAcademicYearId, schoolId }, select: { id: true, label: true, startDate: true } }),
          tx.academicYear.findFirst({ where: { id: targetAcademicYearId, schoolId }, select: { id: true, label: true, startDate: true } }),
          tx.class.findFirst({ where: { id: sourceClassId, schoolId }, select: { id: true, level: true } }),
          tx.class.findFirst({ where: { id: targetClassId, schoolId }, select: { id: true, level: true } }),
        ]);

        if (!sourceYear) throw new EnrollmentPromotionError("Source academic year not found for this school.", 404);
        if (!targetYear) throw new EnrollmentPromotionError("Target academic year not found for this school.", 404);
        if (!sourceClass) throw new EnrollmentPromotionError("Source class not found for this school.", 404);
        if (!targetClass) throw new EnrollmentPromotionError("Target class not found for this school.", 404);
        if (targetYear.startDate <= sourceYear.startDate) {
          throw new EnrollmentPromotionError("Target academic year must start after the source academic year.", 400);
        }
        if (_levelOrder(targetClass.level) <= _levelOrder(sourceClass.level)) {
          throw new EnrollmentPromotionError("Choose a class level above the students' current class.", 400);
        }

        const sourceEnrollments = await tx.enrollment.findMany({
          where: {
            studentId: { in: studentIds },
            academicYearId: sourceYear.id,
            classId: sourceClass.id,
            student: {
              schoolId,
              status: "ACTIVE",
              OR: [
                { deletedAt: null },
                { deletedAt: { isSet: false } },
              ],
            },
          },
          select: { id: true, studentId: true },
        });
        if (sourceEnrollments.length !== studentIds.length) {
          throw new EnrollmentPromotionError(
            "One or more selected students are not active in the chosen source class and academic year.",
            400,
          );
        }

        const alreadyEnrolled = await tx.enrollment.findMany({
          where: { studentId: { in: studentIds }, academicYearId: targetYear.id },
          select: { studentId: true },
        });
        if (alreadyEnrolled.length) {
          throw new EnrollmentPromotionError(
            "One or more students already have an enrollment in the target academic year. Refresh the list and remove them before continuing.",
            409,
          );
        }

        const sourceByStudent = new Map(sourceEnrollments.map((enrollment) => [enrollment.studentId, enrollment]));
        const now = new Date();
        const results = [];
        for (const studentId of studentIds) {
          const sourceEnrollment = sourceByStudent.get(studentId);
          if (!sourceEnrollment) throw new EnrollmentPromotionError("Source enrollment changed. Refresh and try again.", 409);
          const enrollment = await tx.enrollment.create({
            data: {
              studentId,
              classId: targetClass.id,
              academicYearId: targetYear.id,
              enrolledAt: now,
              promotedAt: now,
              promotedFromId: sourceEnrollment.id,
            },
            select: { id: true, studentId: true, promotedAt: true },
          });
          results.push(enrollment);
        }
        return { enrollments: results, targetClassLevel: targetClass.level, targetYearLabel: targetYear.label };
      });

      return NextResponse.json({
        message: `${promotion.enrollments.length} student${promotion.enrollments.length === 1 ? "" : "s"} promoted to ${promotion.targetClassLevel} for ${promotion.targetYearLabel}.`,
        data: promotion.enrollments,
      });
    } catch (error) {
      if (error instanceof EnrollmentPromotionError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        return NextResponse.json({ error: "A student already has an enrollment in the target year." }, { status: 409 });
      }
      console.error("[enrollmentAdminService.promoteStudents]", error);
      return NextResponse.json({ error: "Unable to promote the selected students." }, { status: 500 });
    }
  },
};
