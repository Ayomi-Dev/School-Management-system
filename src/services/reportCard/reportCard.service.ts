import { prisma } from "@/src/lib/prisma/client";
import { ReportCardStatus } from "@/app/generated/prisma/enums";
import { scoreServices  } from "@/src/services/scores/scores.service";
import { NextRequest, NextResponse } from "next/server";
import { compileSchema, updateReportCardSchema } from "@/src/validators/reportCardSchema";

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

    async compileReportCards(req: NextRequest, teacherId: string, classId: string) {
      try{
        const teacher = await prisma.teacherProfile.findUnique({
          where: { userId: teacherId },
          select: { id: true, schoolId: true },
        });
        if (!teacher) {
          return NextResponse.json({ error: 'Teacher profile not found.' }, { status: 404 });
        }
 
        // Authorization: class teacher only
        const classAssignment = await prisma.teacherClassAssignment.findUnique({
          where: { teacherId: teacher.id },
          select: { classId: true },
        });
        if (classAssignment?.classId !== classId) {
          return NextResponse.json(
            { error: 'Only the class teacher can compile report cards.' },
            { status: 403 },
          );
        }
 
      const body = await req.json();
      const parsed = compileSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }
      const { studentId } = parsed.data;
    
      // Resolve active term + academic year + class snapshot in parallel
      const [term, classRecord] = await Promise.all([
        prisma.term.findFirst({
          where: {isCurrent: true },
          select: { id: true, academicYearId: true },
        }),
        prisma.class.findUnique({
          where: { id: classId },
          select: { level: true },
        }),
      ]);
      if (!term) {
        return NextResponse.json(
          { error: 'No active term found for this school.' },
          { status: 400 },
        );
      }
      if (!classRecord) {
        return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
      }
    
      // Confirm student is enrolled in this class for the current academic year
      const enrollment = await prisma.enrollment.findFirst({
        where: { studentId, classId, academicYearId: term.academicYearId },
        select: { id: true },
      });
      if (!enrollment) {
        return NextResponse.json(
          { error: 'Student is not enrolled in this class for the current academic year.' },
          { status: 400 },
        );
      }
    
      // Gather complete scores (both CA + Exam non-null) for this student
      // in this term, scoped to subjects belonging to this class only.
      const scores = await prisma.score.findMany({
        where: {
          studentId,
          termId: term.id,
          subject: { classId },
          caScore: { not: null },
          examScore: { not: null },
        },
        select: {
          subjectId: true,
          caScore: true,
          examScore: true,
          totalScore: true,
          grade: true,
          gradeRemark: true,
          subject: { select: { name: true, code: true } },
        },
      });
    
      if (scores.length === 0) {
        return NextResponse.json(
          {
            error:
              'No complete scores found for this student. Both CA and Exam must be entered for at least one subject before compiling.',
          },
          { status: 400 },
        );
      }
    
      // Aggregate totals
      const totalScore = scores.reduce((sum, s) => sum + (s.totalScore ?? 0), 0);
      const average = Math.round((totalScore / scores.length) * 10) / 10;
    
      // Attendance summary — fresh join, not persisted on the card
      const sessions = await prisma.classSession.findMany({
        where: { classId, termId: term.id, label: 'daily' },
        select: { id: true },
      });
      const sessionIds = sessions.map((s) => s.id);
    
      const attendanceRows = await prisma.attendance.findMany({
        where: { studentId, sessionId: { in: sessionIds } },
        select: { status: true },
      });
      const attendanceSummary = {
        total: sessions.length,
        present: attendanceRows.filter((a) => a.status === 'PRESENT').length,
        absent: attendanceRows.filter((a) => a.status === 'ABSENT').length,
        late: attendanceRows.filter((a) => a.status === 'LATE').length,
      };
    
      // Upsert the report card — preserve any existing teacherRemark/
      // principalRemark the teacher already wrote on a prior compile.
      const reportCard = await prisma.reportCard.upsert({
        where: { studentId_termId: { studentId, termId: term.id } },
        create: {
          studentId,
          termId: term.id,
          academicYearId: term.academicYearId,
          classSnapshot: classRecord.level,
          totalScore,
          average,
          status: 'DRAFT',
          pdfUrl: null, // stubbed — PDF generation is a future feature
        },
        update: {
          // Recompile updates totals + snapshot but never overwrites a
          // remark the teacher already wrote — they'd have to clear it
          // explicitly on the edit page.
          totalScore,
          average,
          classSnapshot: classRecord.level,
          status: 'DRAFT', // recompiling always resets a PUBLISHED card to DRAFT
          publishedAt: null,
        },
      });
    
      // Recompute class positions — must happen after this student's card
      // is upserted so their new totalScore is reflected in the ranking.
      // Fetch all compiled cards for this class+term, sort by totalScore
      // descending, assign positions 1..n with tie-sharing (two students
      // with the same total both get the same position).
      const allCards = await prisma.reportCard.findMany({
        where: {
          termId: term.id,
          student: { enrollments: { some: { classId, academicYearId: term.academicYearId } } },
        },
        select: { id: true, totalScore: true },
        orderBy: { totalScore: 'desc' },
      });
    
      // Assign positions with tie-sharing (dense rank would skip numbers;
      // standard competition rank shares the position for ties).
      let currentPosition = 1;
      let previousScore: number | null = null;
      const positionUpdates = allCards.map((card, index) => {
        if (card.totalScore !== previousScore) {
          currentPosition = index + 1;
          previousScore = card.totalScore;
        }
        return prisma.reportCard.update({
          where: { id: card.id },
          data: { position: currentPosition },
        });
      });
      await prisma.$transaction(positionUpdates);
    
      // Refetch the card with its fresh position for the response
      const finalCard = await prisma.reportCard.findUnique({
        where: { id: reportCard.id },
        select: {
          id: true,
          status: true,
          totalScore: true,
          average: true,
          position: true,
          classSnapshot: true,
          teacherRemark: true,
          principalRemark: true,
        },
      });
    
      return NextResponse.json({
        message: `Report card compiled for student.`,
        data: {
          reportCard: finalCard,
          scores: scores.map((s) => ({
            subjectId: s.subjectId,
            subjectName: s.subject.name,
            subjectCode: s.subject.code,
            caScore: s.caScore,
            examScore: s.examScore,
            totalScore: s.totalScore,
            grade: s.grade,
            gradeRemark: s.gradeRemark,
          })),
          attendanceSummary,
        },
      });
    }   
    catch (error) {
      console.error('[reportCardService.compile]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    } 
  },  

  async getReportCards( teacherId: string, classId: string){
    try{
      const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: teacherId },
        select: { id: true, schoolId: true },
      });
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher profile not found.' }, { status: 404 });
      }
 
      const classAssignment = await prisma.teacherClassAssignment.findUnique({
        where: { teacherId: teacher.id },
        select: { classId: true },
      });
      if (classAssignment?.classId !== classId) {
        return NextResponse.json(
          { error: 'Only the class teacher can view report cards.' },
          { status: 403 },
        );
      }
 
      const term = await prisma.term.findFirst({
        where: { isCurrent: true },
        select: { id: true, academicYearId: true },
      });
      if (!term) {
        return NextResponse.json(
          { error: 'No active term found for this school.' },
          { status: 400 },
        );
      }
 
    // All enrolled students for this class this year
      const enrollments = await prisma.enrollment.findMany({
        where: { classId, academicYearId: term.academicYearId },
        select: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentNumber: true,
            },
          },
        },
        orderBy: { student: { lastName: 'asc' } },
      });
 
    const studentIds = enrollments.map((e) => e.student.id);
 
    // Compiled cards for these students in this term
    const cards = await prisma.reportCard.findMany({
      where: { studentId: { in: studentIds }, termId: term.id },
      select: {
        id: true,
        studentId: true,
        status: true,
        totalScore: true,
        average: true,
        position: true,
        teacherRemark: true,
        publishedAt: true,
        updatedAt: true,
      },
    });
    const cardByStudent = new Map(cards.map((c) => [c.studentId, c]));
 
    const compiled = enrollments
      .filter((e) => cardByStudent.has(e.student.id))
      .map(({ student }) => {
        const card = cardByStudent.get(student.id)!;
        return {
          reportCardId: card.id,
          studentId: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          studentNumber: student.studentNumber,
          status: card.status,
          totalScore: card.totalScore,
          average: card.average,
          position: card.position,
          hasTeacherRemark: !!card.teacherRemark,
          publishedAt: card.publishedAt,
          updatedAt: card.updatedAt,
        };
      })
      // Sort by position (compiled cards are ranked)
      .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
 
    const pending = enrollments
      .filter((e) => !cardByStudent.has(e.student.id))
      .map(({ student }) => ({
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentNumber: student.studentNumber,
      }));
 
    return NextResponse.json({
      data: {
        compiled,
        pending,
        meta: {
          termId: term.id,
          classCount: enrollments.length,
          compiledCount: compiled.length,
          publishedCount: compiled.filter((c) => c.status === 'PUBLISHED').length,
        },
      },
    });
  } catch (error) {
    console.error('[reportCardService.list]', error);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
  },  


  async getSingleReportCard(teacherId: string, classId: string, reportCardId: string) {
    try{
      const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: teacherId },
        select: { id: true, schoolId: true },
      });
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher profile not found.' }, { status: 404 });
      }
 
      const classAssignment = await prisma.teacherClassAssignment.findUnique({
        where: { teacherId: teacher.id },
        select: { classId: true },
      });
      if (classAssignment?.classId !== classId) {
        return NextResponse.json(
          { error: 'Only the class teacher can view report cards.' },
          { status: 403 },
        );
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
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            gender: true,
            enrollments: {
              where: { classId },
              select: { id: true },
            },
          },
        },
        term: {
          select: { id: true },
        },
      },
    });
 
    if (!card || card.student.enrollments.length === 0) {
      return NextResponse.json(
        { error: 'Report card not found for this class.' },
        { status: 404 },
      );
    }
 
    // Subject scores — complete ones only (matching what compile included)
    const scores = await prisma.score.findMany({
      where: {
        studentId: card.student.id,
        termId: card.termId,
        subject: { classId },
        caScore: { not: null },
        examScore: { not: null },
      },
      select: {
        subjectId: true,
        caScore: true,
        examScore: true,
        totalScore: true,
        grade: true,
        gradeRemark: true,
        subject: { select: { name: true, code: true } },
      },
      orderBy: { subject: { name: 'asc' } },
    });
 
    // Attendance summary — recomputed fresh so it reflects any corrections
    // made after the initial compile.
    const sessions = await prisma.classSession.findMany({
      where: { classId, termId: card.termId, label: 'daily' },
      select: { id: true },
    });
    const attendanceRows = await prisma.attendance.findMany({
      where: {
        studentId: card.student.id,
        sessionId: { in: sessions.map((s) => s.id) },
      },
      select: { status: true },
    });
    const attendanceSummary = {
      total: sessions.length,
      present: attendanceRows.filter((a) => a.status === 'PRESENT').length,
      absent: attendanceRows.filter((a) => a.status === 'ABSENT').length,
      late: attendanceRows.filter((a) => a.status === 'LATE').length,
    };
 
    return NextResponse.json({
      data: {
        reportCard: {
          id: card.id,
          status: card.status,
          totalScore: card.totalScore,
          average: card.average,
          position: card.position,
          classSnapshot: card.classSnapshot,
          teacherRemark: card.teacherRemark,
          principalRemark: card.principalRemark,
          publishedAt: card.publishedAt,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
        },
        student: {
          id: card.student.id,
          firstName: card.student.firstName,
          lastName: card.student.lastName,
          studentNumber: card.student.studentNumber,
          gender: card.student.gender,
        },
        scores: scores.map((s) => ({
          subjectId: s.subjectId,
          subjectName: s.subject.name,
          subjectCode: s.subject.code,
          caScore: s.caScore,
          examScore: s.examScore,
          totalScore: s.totalScore,
          grade: s.grade,
          gradeRemark: s.gradeRemark,
        })),
        attendanceSummary,
      },
    });
  } 
  catch (error) {
    console.error('[reportCardService.getOne]', error);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  } 
},
      /**
       * Bulk-generate report cards for all students in a class for a given term.
       */
  

      // ============================================================
      // PUBLISH REPORT CARD
      // ============================================================
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

    async publishReportCard(
      req: NextRequest,
      teacherId: string,
      classId: string,
      reportCardId: string,
    ) {
      try{
        const teacher = await prisma.teacherProfile.findUnique({
          where: { userId: teacherId },
          select: { id: true },
        });
        if (!teacher) {
          return NextResponse.json({ error: 'Teacher profile not found.' }, { status: 404 });
        }
 
        const classAssignment = await prisma.teacherClassAssignment.findUnique({
          where: { teacherId: teacher.id },
          select: { classId: true },
        });
        if (classAssignment?.classId !== classId) {
          return NextResponse.json(
            { error: 'Only the class teacher can update report cards.' },
            { status: 403 },
          );
        }
 
    // Confirm the report card belongs to a student in this class —
    // prevents a teacher from editing another class's cards by guessing ids.
        const existing = await prisma.reportCard.findUnique({
          where: { id: reportCardId },
          select: {
            id: true,
            status: true,
            teacherRemark: true,
            student: {
              select: {
                enrollments: {
                  where: { classId },
                  select: { id: true },
                },
              },
            },
          },
        });
 
        if (!existing || existing.student.enrollments.length === 0) {
          return NextResponse.json(
            { error: 'Report card not found for this class.' },
            { status: 404 },
          );
        }
 
    const body = await req.json();
    const parsed = updateReportCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
 
    // ── remark ────────────────────────────────────────────────────────────
    if (parsed.data.action === 'remark') {
      const updated = await prisma.reportCard.update({
        where: { id: reportCardId },
        data: { teacherRemark: parsed.data.teacherRemark },
        select: { id: true, teacherRemark: true, status: true },
      });
      return NextResponse.json({
        message: 'Teacher remark saved.',
        data: updated,
      });
    }
 
    // ── publish ───────────────────────────────────────────────────────────
    if (existing.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'This report card is already published.' },
        { status: 409 },
      );
    }
 
    if (!existing.teacherRemark?.trim()) {
      return NextResponse.json(
        { error: 'Add a teacher remark before publishing.' },
        { status: 400 },
      );
    }
 
    const published = await prisma.reportCard.update({
      where: { id: reportCardId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
      select: { id: true, status: true, publishedAt: true },
    });
 
    return NextResponse.json({
      message: 'Report card published successfully.',
      data: published,
    });
  } catch (error) {
    console.error('[reportCardService.update]', error);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
      
    },

      // ============================================================
      // QUERIES
      // ============================================================

    async getReportCardByStudentOrParent(studentId: string, termId: string) {
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