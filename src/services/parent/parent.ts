import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma/client';
import { resolveGuardian } from '@/src/utils/resolvers';


// ─── Service ──────────────────────────────────────────────────────────────────

export const parentService = {
    async getParentById(parentId: string, schoolId: string) {
        const parent = await prisma.guardian.findUnique(
            { where: { id: parentId } }
        )
        if(!parent){
            return NextResponse.json(
                { error: "Parent not found" },
                { status: 404 }
            )
        }
        return parent;
    },
  // ───────────────────────────────────────────────────────────────────────────
  // GET /parent/students
  //
  // Returns all students linked to this parent's guardian record, with
  // enough information to render dashboard cards:
  //   - name, class, school, current term
  //   - snapshot numbers: attendance rate, published card count, subject count
  //
  // The snapshot figures are computed efficiently with aggregates rather than
  // fetching every row — the full detail queries happen on the student page.
  // ───────────────────────────────────────────────────────────────────────────
  async getLinkedStudents(parentUserId: string) {
    try {
      const guardianId = await resolveGuardian(parentUserId);
      if (!guardianId) {
        // A parent with no guardian record has no linked students yet —
        // not an error, just an empty state.
        return NextResponse.json({ data: [] });
      }

      const students = await prisma.studentProfile.findMany({
        where:  { guardianId },
        select: {
          id:            true,
          firstName:     true,
          lastName:      true,
          studentNumber: true,
          gender:        true,
          dateOfBirth:   true,
          userId:        true,
          school: { select: { id: true, name: true } },
          enrollments: {
            orderBy: { enrolledAt: 'desc' },
            take:    1,
            select: {
              class: { select: { id: true, level: true } },
              academicYear: {
                select: {
                  id:    true,
                  label: true,
                  terms: {
                    where:   { isCurrent: true },
                    take:    1,
                    select:  {
                      id:     true,
                      period: true,
                      academicYear: { select: { label: true } },
                    },
                  },
                },
              },
            },
          },
          // Published report card count
          _count: {
            select: {
              reportCards: { where: { status: 'PUBLISHED' } },
            },
          },
        },
      });

      // For each student build the snapshot numbers in parallel
      const enriched = await Promise.all(
        students.map(async (s) => {
          const currentEnrollment = s.enrollments[0] ?? null;
          const currentTerm       = currentEnrollment?.academicYear.terms[0] ?? null;

          // Attendance rate — groupBy so we don't hydrate every row
          const attendanceCounts = await prisma.attendance.groupBy({
            by:    ['status'],
            where: {
              studentId: s.id,
              ...(currentTerm ? { session: { termId: currentTerm.id } } : {}),
            },
            _count: { status: true },
          });
          const countOf = (status: string) =>
            attendanceCounts.find((r) => r.status === status)?._count.status ?? 0;
          const present      = countOf('PRESENT') + countOf('LATE');
          const totalSession = countOf('PRESENT') + countOf('LATE') + countOf('ABSENT') + countOf('UNMARKED');
          const attendanceRate = totalSession > 0
            ? parseFloat(((present / totalSession) * 100).toFixed(1))
            : 0;

          // Subject count for current term
          const totalSubjects = currentTerm
            ? await prisma.score.count({
                where: { studentId: s.id, termId: currentTerm.id, isPublished: true },
              })
            : 0;

          return {
            studentId:     s.id,
            userId:        s.userId,
            firstName:     s.firstName,
            lastName:      s.lastName,
            studentNumber: s.studentNumber,
            gender:        s.gender,
            dateOfBirth:   s.dateOfBirth?.toISOString() ?? null,
            currentClass:  currentEnrollment?.class ?? null,
            school:        s.school,
            currentTerm:   currentTerm ?? null,
            snapshot: {
              attendanceRate,
              publishedCards: s._count.reportCards,
              totalSubjects,
            },
          };
        }),
      );
      console.log('[parentService.getLinkedStudents] enriched', enriched);

      return NextResponse.json({ data: enriched });
    } catch (error) {
      console.error('[parentService.getLinkedStudents]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // GET /parent/students/:studentId/summary?termId=<optional>
  //
  // Full academic detail for one linked student.
  // Key parent-specific restrictions:
  //   - Only PUBLISHED scores are returned (isPublished: true)
  //   - Only PUBLISHED report cards are returned
  //   - The parent must be the student's linked guardian
  // ───────────────────────────────────────────────────────────────────────────
  async getStudentSummary(
    parentUserId: string,
    studentId:    string,   // StudentProfile.id
    termId?:      string,
  ) {
    try {
      const guardianId = await resolveGuardian(parentUserId);
      if (!guardianId) {
        return NextResponse.json({ error: 'Guardian record not found.' }, { status: 403 });
      }

      // Verify this student is actually linked to the parent's guardian
      const student = await prisma.studentProfile.findFirst({
        where:  { id: studentId, guardianId },
        select: {
          id:            true,
          userId:        true,
          firstName:     true,
          lastName:      true,
          studentNumber: true,
          gender:        true,
          school: { select: { name: true } },
          enrollments: {
            orderBy: { enrolledAt: 'desc' },
            take:    1,
            select:  { class: { select: { id: true, level: true } } },
          },
        },
      });
      if (!student) {
        return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
      }

      const termFilter = termId ? { termId } : {};

      const [scores, attendanceCounts, reportCards, enrollments] = await Promise.all([
        // Published scores only — parents never see draft/unreleased scores
        prisma.score.findMany({
          where: {
            studentId:   student.id,
            isPublished: true,
            ...termFilter,
          },
          select: {
            subjectId:   true,
            termId:      true,
            caScore:     true,
            examScore:   true,
            totalScore:  true,
            grade:       true,
            gradeRemark: true,
            subject: { select: { name: true, code: true } },
            term: {
              select: {
                id:     true,
                period: true,
                academicYear: { select: { label: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),

        prisma.attendance.groupBy({
          by:    ['status'],
          where: {
            studentId: student.id,
            ...(termId ? { session: { termId } } : {}),
          },
          _count: { status: true },
        }),

        // Published report cards only
        prisma.reportCard.findMany({
          where: {
            studentId: student.id,
            status:    'PUBLISHED',
            ...termFilter,
          },
          select: {
            id:              true,
            termId:          true,
            academicYearId:  true,
            status:          true,
            totalScore:      true,
            average:         true,
            position:        true,
            teacherRemark:   true,
            principalRemark: true,
            publishedAt:     true,
            term:         { select: { id: true, period: true } },
            academicYear: { select: { id: true, label: true } },
          },
          orderBy: { publishedAt: 'desc' },
        }),

        prisma.enrollment.findMany({
          where:   { studentId: student.id },
          include: {
            class:        { select: { level: true } },
            academicYear: { select: { label: true } },
          },
          orderBy: { enrolledAt: 'desc' },
        }),
      ]);

      const countFor = (s: string) =>
        attendanceCounts.find((r) => r.status === s)?._count.status ?? 0;
      const presentCount  = countFor('PRESENT');
      const lateCount     = countFor('LATE');
      const absentCount   = countFor('ABSENT');
      const unmarkedCount = countFor('UNMARKED');
      const totalSessions = presentCount + lateCount + absentCount + unmarkedCount;
      const attendanceRate = totalSessions > 0
        ? parseFloat((((presentCount + lateCount) / totalSessions) * 100).toFixed(1))
        : 0;

      return NextResponse.json({
        data: {
          student: {
            id:            student.id,
            userId:        student.userId,
            firstName:     student.firstName,
            lastName:      student.lastName,
            studentNumber: student.studentNumber,
            gender:        student.gender,
            currentClass:  student.enrollments[0]?.class ?? null,
            school:        student.school,
          },
          enrollments,
          scores: scores.map((s) => ({
            subjectId:   s.subjectId,
            subjectName: s.subject.name,
            subjectCode: s.subject.code,
            termId:      s.termId,
            term:        s.term,
            caScore:     s.caScore,
            examScore:   s.examScore,
            totalScore:  s.totalScore,
            grade:       s.grade,
            gradeRemark: s.gradeRemark,
          })),
          attendance: {
            total:    totalSessions,
            present:  presentCount,
            late:     lateCount,
            absent:   absentCount,
            unmarked: unmarkedCount,
            rate:     attendanceRate,
          },
          reportCards,
        },
      });
    } catch (error) {
      console.error('[parentService.getStudentSummary]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // GET /parent/report-cards/:reportCardId
  //
  // Single published report card with scores and attendance.
  // Guard: parent must be the guardian of the student on the card,
  //        and the card must be PUBLISHED.
  // ───────────────────────────────────────────────────────────────────────────
  async getStudentReportCard(parentUserId: string, reportCardId: string) {
    try {
      const guardianId = await resolveGuardian(parentUserId);
      if (!guardianId) {
        return NextResponse.json({ error: 'Guardian record not found.' }, { status: 403 });
      }

      const card = await prisma.reportCard.findUnique({
        where:  { id: reportCardId },
        select: {
          id:              true,
          status:          true,
          totalScore:      true,
          average:         true,
          position:        true,
          teacherRemark:   true,
          principalRemark: true,
          publishedAt:     true,
          termId:          true,
          student: {
            select: {
              id:            true,
              firstName:     true,
              lastName:      true,
              studentNumber: true,
              gender:        true,
              guardianId:    true,
              enrollments: {
                orderBy: { enrolledAt: 'desc' },
                take:    1,
                select:  { classId: true, class: { select: { level: true } } },
              },
            },
          },
          term: {
            select: { id: true, period: true, academicYear: { select: { label: true } } },
          },
        },
      });

      // Guard: card must exist, be PUBLISHED, and belong to a student
      // linked to this parent's guardian record
      if (
        !card ||
        card.status !== 'PUBLISHED' ||
        card.student.guardianId !== guardianId
      ) {
        return NextResponse.json({ error: 'Report card not found.' }, { status: 404 });
      }

      const classId = card.student.enrollments[0]?.classId;

      const scores = await prisma.score.findMany({
        where: {
          studentId:   card.student.id,
          termId:      card.termId,
          isPublished: true,
          ...(classId ? { subject: { classId } } : {}),
          caScore:   { not: null },
          examScore: { not: null },
        },
        select: {
          subjectId:   true,
          caScore:     true,
          examScore:   true,
          totalScore:  true,
          grade:       true,
          gradeRemark: true,
          subject: { select: { name: true, code: true } },
        },
        orderBy: { subject: { name: 'asc' } },
      });

      const sessions = classId
        ? await prisma.classSession.findMany({
            where:  { classId, termId: card.termId, label: 'daily' },
            select: { id: true },
          })
        : [];
      const attendanceRows = sessions.length
        ? await prisma.attendance.findMany({
            where: {
              studentId: card.student.id,
              sessionId: { in: sessions.map((s) => s.id) },
            },
            select: { status: true },
          })
        : [];

      const attendanceSummary = {
        total:   sessions.length,
        present: attendanceRows.filter((a) => a.status === 'PRESENT').length,
        absent:  attendanceRows.filter((a) => a.status === 'ABSENT').length,
        late:    attendanceRows.filter((a) => a.status === 'LATE').length,
      };

      return NextResponse.json({
        data: {
          reportCard: {
            id:              card.id,
            totalScore:      card.totalScore,
            average:         card.average,
            position:        card.position,
            teacherRemark:   card.teacherRemark,
            principalRemark: card.principalRemark,
            publishedAt:     card.publishedAt,
            classLevel:      card.student.enrollments[0]?.class.level ?? null,
            term: {
              period:       card.term.period,
              academicYear: card.term.academicYear.label,
            },
          },
          student: {
            firstName:     card.student.firstName,
            lastName:      card.student.lastName,
            studentNumber: card.student.studentNumber,
            gender:        card.student.gender,
          },
          scores: scores.map((s) => ({
            subjectId:   s.subjectId,
            subjectName: s.subject.name,
            subjectCode: s.subject.code,
            caScore:     s.caScore,
            examScore:   s.examScore,
            totalScore:  s.totalScore,
            grade:       s.grade,
            gradeRemark: s.gradeRemark,
          })),
          attendanceSummary,
        },
      });
    } catch (error) {
      console.error('[parentService.getStudentReportCard]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
};