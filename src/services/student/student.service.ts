import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma/client";
import { updateStudentSchema, promoteStudentSchema, listStudentsQuerySchema } from "@/src/validators/studentSchema";
import { buildPaginationMeta, paginationArgs } from "@/src/utils/pagination";

// ============================================================
// STUDENT SERVICE
// ============================================================

export const studentService = {
  // ----------------------------------------------------------------
  // GET STUDENT BY ID
  // ----------------------------------------------------------------
  async getStudentById(studentProfileId: string, schoolId: string) {
    try {
        const student = await prisma.studentProfile.findFirst({
            where: { id: studentProfileId, schoolId },
            include: {
                user: {
                    select: {
                        id: true, email: true, phone: true, userCode: true,
                        status: true, lastLoginAt: true,
                    },
                },
                enrollments: {
                    orderBy: { enrolledAt: "desc" },
                    include: {
                      class: { select: { id: true, name: true, level: true } },
                      academicYear: { select: { id: true, label: true } },
                    },
                },
                guardians: {
                    include: {
                        guardian: {
                            select: {
                              firstName: true, lastName: true, phone: true,
                              email: true, relationship: true,
                            },
                        },
                    },
                },
            },
        });

        if(!student) {
            return NextResponse.json({ error: "Student not found." }, { status: 404 });
        } 
        return NextResponse.json({ data: student });
    } 
    catch (error) {
        console.error("[studentService.getById]", error);
        return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },

  // -----------------------------------------------------------------
  // LIST STUDENTS (with filters + pagination)
  // ----------------------------------------------------------------
  async listStudents(req: NextRequest, schoolId: string) {
    try {
        const { searchParams } = new URL(req.url);
        const parsed = listStudentsQuerySchema.safeParse(
          Object.fromEntries(searchParams.entries())
        );
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid query params", details: parsed.error.flatten().fieldErrors },
            { status: 400 }
          );
        }

        const { page, limit, classId, academicYearId, status, search } = parsed.data;

        // Build where clause
        const where: any = { schoolId };
        if (status) where.status = status;
        if (search) {
          where.OR = [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { studentNumber: { contains: search, mode: "insensitive" } },
          ];
        }

        // Filter by class/academicYear via enrollments
        if (classId || academicYearId) {
          where.enrollments = {
            some: {
              ...(classId ? { classId } : {}),
              ...(academicYearId ? { academicYearId } : {}),
            },
          };
        }

        const [total, students] = await Promise.all([
          prisma.studentProfile.count({ where }),
          prisma.studentProfile.findMany({
            where,
            ...paginationArgs(page, limit),
            orderBy: { lastName: "asc" },
            include: {
              user: { select: { email: true, userCode: true, status: true } },
              enrollments: {
                where: academicYearId ? { academicYearId } : {},
                take: 1,
                orderBy: { enrolledAt: "desc" },
                include: {
                  class: { select: { id: true, name: true } },
                  academicYear: { select: { id: true, label: true } },
                },
              },
            },
          }),
        ]);

        return NextResponse.json({
          data: students,
          meta: buildPaginationMeta(total, page, limit),
        });
    } 
    catch (error) {
      console.error("[studentService.list]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },

  // ----------------------------------------------------------------
  // UPDATE STUDENT PROFILE
  // ----------------------------------------------------------------
  async updateStudentProfile(req: NextRequest, studentProfileId: string, schoolId: string) {
    try {
      const body = await req.json();
      const parsed = updateStudentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const student = await prisma.studentProfile.findFirst({
        where: { id: studentProfileId, schoolId },
        select: { id: true, userId: true },
      });
      if (!student) {
        return NextResponse.json({ error: "Student not found." }, { status: 404 });
      }

      const { status, exitReason, level, phone, ...profileFields } = parsed.data;

      const updated = await prisma.$transaction(async (tx) => {
        // Update profile
        const profile = await tx.studentProfile.update({
          where: { id: studentProfileId },
          data: {
            ...profileFields,
            ...(level ? { level } : {}),
            ...(status ? { status } : {}),
            ...(exitReason ? { exitReason } : {}),
            ...(status && status !== "ACTIVE" ? { deletedAt: new Date() } : {}),
          },
        });

        // Sync phone on user record
        if (phone) {
          await tx.user.update({
            where: { id: student.userId },
            data: { phone },
          });
        }

        return profile;
      });

      return NextResponse.json({ message: "Student updated.", data: updated });
    } catch (error) {
      console.error("[studentService.update]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },

  // ----------------------------------------------------------------
  // PROMOTE STUDENTS
  // Moves a batch of students to a new class in a new academic year.
  // Creates a fresh Enrollment row; old one is kept for history.
  // ----------------------------------------------------------------
  async promoteStudent(req: NextRequest, schoolId: string) {
    try {
      const body = await req.json();
      const parsed = promoteStudentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { studentIds, newClassId, newAcademicYearId } = parsed.data;

      // Validate class + year belong to school
      const [targetClass, targetYear] = await Promise.all([
        prisma.class.findFirst({ where: { id: newClassId, schoolId }, select: { id: true } }),
        prisma.academicYear.findFirst({
          where: { id: newAcademicYearId, schoolId },
          select: { id: true },
        }),
      ]);

      if (!targetClass) {
        return NextResponse.json({ error: "Target class not found." }, { status: 404 });
      }
      if (!targetYear) {
        return NextResponse.json({ error: "Target academic year not found." }, { status: 404 });
      }

      // Fetch student profiles (must belong to school)
      const profiles = await prisma.studentProfile.findMany({
        where: { id: { in: studentIds }, schoolId },
        select: { id: true },
      });
      if (profiles.length !== studentIds.length) {
        return NextResponse.json(
          { error: "One or more student IDs are invalid or not in this school." },
          { status: 400 }
        );
      }

      // Fetch current enrollments (latest per student)
      const currentEnrollments = await prisma.enrollment.findMany({
        where: {
          studentId: { in: studentIds },
          academicYearId: { not: newAcademicYearId }, // ignore if already enrolled this year
        },
        orderBy: { enrolledAt: "desc" },
        distinct: ["studentId"],
        select: { id: true, studentId: true },
      });
      const prevEnrollmentMap = Object.fromEntries(
        currentEnrollments.map((e) => [e.studentId, e.id])
      );

      const now = new Date();

      // Upsert enrollments in transaction
      const results = await prisma.$transaction(
        profiles.map((p) =>
          prisma.enrollment.upsert({
            where: {
              studentId_academicYearId: {
                studentId: p.id,
                academicYearId: newAcademicYearId,
              },
            },
            create: {
              studentId: p.id,
              classId: newClassId,
              academicYearId: newAcademicYearId,
              enrolledAt: now,
              promotedAt: now,
              promotedFromId: prevEnrollmentMap[p.id] ?? null,
            },
            update: {
              classId: newClassId,
              promotedAt: now,
              promotedFromId: prevEnrollmentMap[p.id] ?? null,
            },
          })
        )
      );

      return NextResponse.json({
        message: `${results.length} student(s) promoted successfully.`,
        data: results,
      });
    } catch (error) {
      console.error("[studentService.promote]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },

  // ----------------------------------------------------------------
  // GET STUDENT ACADEMIC SUMMARY
  // Returns enrollments, scores, attendance rate, report cards
  // ----------------------------------------------------------------
  async getStudentAcademicSummary(studentProfileId: string, schoolId: string, termId?: string) {
    try {
      const student = await prisma.studentProfile.findFirst({
        where: { id: studentProfileId, schoolId },
        select: { id: true, firstName: true, lastName: true, studentNumber: true },
      });
      if (!student) {
        return NextResponse.json({ error: "Student not found." }, { status: 404 });
      }

      const scoreWhere: any = { studentId: studentProfileId };
      if (termId) scoreWhere.termId = termId;

      const attendanceWhere: any = { studentId: studentProfileId };

      const [scores, attendances, reportCards, enrollments] = await Promise.all([
        prisma.score.findMany({
          where: scoreWhere,
          include: {
            subject: { select: { name: true, code: true } },
            term: { select: { period: true, academicYear: { select: { label: true } } } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.attendance.findMany({
          where: attendanceWhere,
          select: { status: true },
        }),
        prisma.reportCard.findMany({
          where: { studentId: studentProfileId },
          orderBy: { createdAt: "desc" },
          include: {
            term: { select: { period: true } },
            academicYear: { select: { label: true } },
          },
        }),
        prisma.enrollment.findMany({
          where: { studentId: studentProfileId },
          include: {
            class: { select: { name: true, level: true } },
            academicYear: { select: { label: true } },
          },
          orderBy: { enrolledAt: "desc" },
        }),
      ]);

      const totalSessions = attendances.length;
      const presentCount = attendances.filter((a) => a.status === "PRESENT").length;
      const lateCount = attendances.filter((a) => a.status === "LATE").length;
      const attendanceRate =
        totalSessions > 0
          ? (((presentCount + lateCount) / totalSessions) * 100).toFixed(1)
          : "N/A";

      return NextResponse.json({
        data: {
          student,
          enrollments,
          scores,
          attendance: {
            total: totalSessions,
            present: presentCount,
            late: lateCount,
            absent: attendances.filter((a) => a.status === "ABSENT").length,
            rate: attendanceRate,
          },
          reportCards,
        },
      });
    } catch (error) {
      console.error("[studentService.getSummary]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },
};

