import { Role } from "@prisma/client";
import { prisma } from "@/src/lib/prisma/client";

export class ReportCardDownloadError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "ReportCardDownloadError";
  }
}

export interface ReportCardDownloadActor {
  userId: string;
  schoolId: string;
  role: Role;
}

export const reportCardDownloadService = {
  async getDocumentData(reportCardId: string, actor: ReportCardDownloadActor) {
    if (!/^[a-f\d]{24}$/i.test(reportCardId)) {
      throw new ReportCardDownloadError("Report card not found.", 404);
    }

    const card = await prisma.reportCard.findUnique({
      where: { id: reportCardId },
      select: {
        id: true,
        status: true,
        totalScore: true,
        average: true,
        position: true,
        classSnapshot: true,
        teacherRemark: true,
        principalRemark: true,
        publishedAt: true,
        termId: true,
        academicYearId: true,
        student: {
          select: {
            id: true,
            schoolId: true,
            guardianId: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            gender: true,
            school: {
              select: {
                name: true,
                address: true,
                phone: true,
                email: true,
                branding: {
                  select: {
                    primaryColor: true,
                    reportCardFooter: true,
                  },
                },
              },
            },
          },
        },
        term: {
          select: {
            period: true,
            startDate: true,
            endDate: true,
            academicYear: { select: { label: true } },
          },
        },
      },
    });

    if (!card || card.student.schoolId !== actor.schoolId) {
      throw new ReportCardDownloadError("Report card not found.", 404);
    }

    if (actor.role === Role.STUDENT) {
      const student = await prisma.studentProfile.findUnique({
        where: { userId: actor.userId },
        select: { id: true, schoolId: true },
      });
      if (!student || student.id !== card.student.id || student.schoolId !== actor.schoolId) {
        throw new ReportCardDownloadError("Report card not found.", 404);
      }
    } else if (actor.role === Role.PARENT) {
      const guardian = await prisma.guardian.findUnique({
        where: { userId: actor.userId },
        select: { id: true },
      });
      if (!guardian || card.student.guardianId !== guardian.id || card.status !== "PUBLISHED") {
        throw new ReportCardDownloadError("Report card not found.", 404);
      }
    } else if (actor.role === Role.TEACHER) {
      const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: actor.userId },
        select: { id: true, schoolId: true },
      });
      if (!teacher || teacher.schoolId !== actor.schoolId) {
        throw new ReportCardDownloadError("Report card not found.", 404);
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: { studentId: card.student.id, academicYearId: card.academicYearId },
        select: { classId: true },
      });
      const assignment = enrollment ? await prisma.teacherClassAssignment.findFirst({
        where: {
          teacherId: teacher.id,
          classId: enrollment.classId,
          academicYearId: card.academicYearId,
          isClassTeacher: true,
        },
        select: { id: true },
      }) : null;
      if (!assignment) {
        throw new ReportCardDownloadError("Only the student's class teacher can download this report card.", 403);
      }
    } else if (actor.role !== Role.ADMIN) {
      throw new ReportCardDownloadError("You are not allowed to download report cards.", 403);
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: card.student.id, academicYearId: card.academicYearId },
      select: { classId: true, class: { select: { level: true } } },
    });
    const classId = enrollment?.classId;

    const [scores, sessions] = await Promise.all([
      prisma.score.findMany({
        where: {
          studentId: card.student.id,
          termId: card.termId,
          caScore: { not: null },
          examScore: { not: null },
          ...(classId ? { subject: { classId } } : {}),
          ...(actor.role === Role.PARENT ? { isPublished: true } : {}),
        },
        select: {
          caScore: true,
          examScore: true,
          totalScore: true,
          grade: true,
          gradeRemark: true,
          subject: { select: { name: true, code: true } },
        },
        orderBy: { subject: { name: "asc" } },
      }),
      classId
        ? prisma.classSession.findMany({
            where: { classId, termId: card.termId, label: "daily" },
            select: { id: true },
          })
        : Promise.resolve([]),
    ]);

    const attendanceRows = sessions.length
      ? await prisma.attendance.findMany({
          where: { studentId: card.student.id, sessionId: { in: sessions.map((session) => session.id) } },
          select: { status: true },
        })
      : [];

    return {
      school: {
        name: card.student.school.name,
        primaryColor: card.student.school.branding?.primaryColor ?? "#1D4ED8",
        footer: card.student.school.branding?.reportCardFooter ?? null,
      },
      student: {
        firstName: card.student.firstName,
        lastName: card.student.lastName,
        studentNumber: card.student.studentNumber,
        gender: card.student.gender,
        className: enrollment?.class.level ?? card.classSnapshot ?? "—",
      },
      reportCard: {
        id: card.id,
        status: card.status,
        totalScore: card.totalScore,
        average: card.average,
        position: card.position,
        teacherRemark: card.teacherRemark,
        principalRemark: card.principalRemark,
        publishedAt: card.publishedAt?.toISOString() ?? null,
        term: card.term.period,
        academicYear: card.term.academicYear.label,
        termStart: card.term.startDate.toISOString(),
        termEnd: card.term.endDate.toISOString(),
      },
      scores: scores.map((score) => ({
        subjectName: score.subject.name,
        subjectCode: score.subject.code,
        caScore: score.caScore,
        examScore: score.examScore,
        totalScore: score.totalScore,
        grade: score.grade,
        gradeRemark: score.gradeRemark,
      })),
      attendance: {
        sessions: sessions.length,
        present: attendanceRows.filter((row) => row.status === "PRESENT").length,
        late: attendanceRows.filter((row) => row.status === "LATE").length,
        absent: attendanceRows.filter((row) => row.status === "ABSENT").length,
      },
    };
  },
};

export type ReportCardPdfData = Awaited<ReturnType<typeof reportCardDownloadService.getDocumentData>>;
