import { prisma } from "@/src/lib/prisma/client";
import { ClassLevel, Department, TermPeriod } from "@/src/types";
import { computeTotalAndGrade, resolveAssessmentConfig } from "@/src/utils/grading";
import { buildPaginationMeta, paginationArgs } from "@/src/utils/pagination";
import { resolveAcademicYear, resolveClassByName, ResolverError, resolveScoreAccess, resolveSubject, resolveTeacher, resolveTerm, resolveTermByPeriod } from "@/src/utils/resolvers";
import { markAttendanceSchema } from "@/src/validators/attendanceSchema";
import { compileSchema } from "@/src/validators/reportCardSchema";
import { saveScoresSchema } from "@/src/validators/scoreSchema";
import { assignClassTeacherSchema, assignSubjectToTeacherSchema } from "@/src/validators/teacherSchema";
import { NextRequest, NextResponse } from "next/server";


export const teacherServices = { 
  async getTeacherById (teacherId: string, schoolId: string) {
    try {
      const teacher = await prisma.teacherProfile.findFirst(
        {
          where: { userId: teacherId, schoolId },
          select: { id: true, firstName: true, }
        }
      )
      if(!teacher){
        return NextResponse.json({ error: "Teacher not found." }, { status: 404 });
      }
      return NextResponse.json({ data: teacher });
    } 
    catch (error) {
      console.error("[teacherServices.getTeacherById]", error);
      return NextResponse.json(
        { error: "Unexpected error" },
        { status: 500 }
      )
    }
  },

  async assignSubject(req: NextRequest, schoolId: string) {
    try {
      const body = await req.json();
      const parsed = assignSubjectToTeacherSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
            { status: 400 }
        );
      }

      const { subjectName, level, teacherNumber } = parsed.data;
      let teacher:     { id: string };
      let classRecord: { id: string; level: string; department: string | null };
      let term:        { id: string };
      
      try {
        // ── Step 1: resolve teacher + class + term in parallel (neither depends on the other)
        [teacher, classRecord, term] = await Promise.all([
          resolveTeacher(schoolId, teacherNumber),
          prisma.class.findFirst({
            where:  { schoolId, level },
            select: { id: true, level: true, department: true },
          }).then((c) => {
              if (!c) throw new ResolverError(`Class "${level}" not found in this school.`);
              return c;
          }),
          await resolveTerm(schoolId)
        ]);

           
      } 
      catch (err) {
        if (err instanceof ResolverError) {
          return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        throw err;
      }

      const assignment = await prisma.$transaction(async (tx) => {
        // find or create the Subject scoped to this class
        // Subject identity is now (classId, name) not (schoolId, name, teacherId)
        // We use upsert so repeated calls are idempotent
        const subject = await tx.subject.upsert({
          where: {
            classId_name: {
              classId: classRecord.id,
              name:    subjectName,
            },
          },
          create: {
            name:     subjectName,
            schoolId,
            classId:  classRecord.id,
          },
          update: {}, // subject already exists for this class — nothing to change on it
          select: { id: true },
        });

        // ── Step 4: assign the teacher to the subject for this class + term
            // teacherId is no longer on Subject — it lives exclusively on SubjectTeacher
        const record = await tx.subjectTeacher.upsert({
          where: {
            subjectId_classId_teacherId: {
              subjectId: subject.id,
              classId:   classRecord.id,
              teacherId: teacher.id,
            },
          },
          create: {
            subjectId: subject.id,
            classId:   classRecord.id,
            teacherId: teacher.id,
            termId:    term.id,
          },
          update: {
            termId:     term.id,      // update term if re-assigning for a different term
            assignedAt: new Date(),
          },
        })
        return { subject, record };
      });

      return NextResponse.json({
        message:  `"${subjectName}" assigned to ${teacherNumber} for ${level}.`,
        data: assignment,
      });
    } 
    catch (error) {
      console.error("[teacherService.assignSubject]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },
 
  // ----------------------------------------------------------------
  // REMOVE SUBJECT ASSIGNMENT
  // DELETE /schools/:schoolId/teachers/:employeeNumber/subjects
  // Body: { subjectName, className, termPeriod? }
  // ----------------------------------------------------------------
  async removeSubjectAssignment(
    req: NextRequest,
    schoolId: string,
  ) {
    try {
      const body = await req.json();
      const parsed = assignSubjectToTeacherSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
 
      const { subjectName, level, teacherNumber } = parsed.data;

      let teacher: { id: string };
      let subject: { id: string };
      let classRecord: { id: string; level: string; department: string | null } | null;
      let term:    { id: string };
 
      try {
        [teacher, classRecord, subject, term] = await Promise.all([
          resolveTeacher(schoolId, teacherNumber),
          resolveClassByName(schoolId, level),
          resolveSubject(schoolId, subjectName),
          resolveTerm(schoolId)
        ]);

      } catch (err) {
        if (err instanceof ResolverError) {
          return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        throw err;
      }
 
      const record = await prisma.subjectTeacher.findFirst({
        where: {
          teacherId: teacher.id,
          subjectId: subject.id,
          classId:   classRecord?.id,
          termId:    term.id,
        },
        select: { id: true },
      });
      if (!record) {
        return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
      }
 
      await prisma.subjectTeacher.delete({ where: { id: record.id } });
      return NextResponse.json({ message: "Subject assignment removed." });
    } catch (error) {
      console.error("[teacherService.removeSubjectAssignment]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },
 
  // ----------------------------------------------------------------
  // ASSIGN CLASS TEACHER
  // POST /schools/:schoolId/classes/:className/teacher
  //
  // Body: { teacherEmployeeNumber, isClassTeacher, academicYearLabel? }
  // className from route param; academicYearLabel defaults to current.
  // ----------------------------------------------------------------
  async assignClassTeacher(req: NextRequest, schoolId: string) {
    try {
      const body = await req.json();
      const parsed = assignClassTeacherSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
 
      const { teacherEmployeeNumber, isClassTeacher, academicYearLabel, level } = parsed.data;
 
      let teacher:      { id: string  };
      let classRecord:  { level: ClassLevel; id: string; department: Department | null; } | null
      let academicYear: { id: string; label: string };
 
      try {
        [teacher, classRecord, academicYear] = await Promise.all([
          resolveTeacher(schoolId, teacherEmployeeNumber),
          resolveClassByName(schoolId, level),
          resolveAcademicYear(schoolId, academicYearLabel),
        ]);
 
        if (!classRecord) throw new ResolverError(`Class "${level}" not found.`);
      } catch (err) {
        if (err instanceof ResolverError) {
          return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        throw err;
      }
      
      const assignment = await prisma.teacherClassAssignment.upsert({
        where: { teacherId: teacher.id},
        create: {
          teacherId:      teacher.id,
          classId:        classRecord.id,
          academicYearId: academicYear.id,
          isClassTeacher,
        },
        update: { isClassTeacher },
      });
      return NextResponse.json({
        message: `${teacherEmployeeNumber} assigned to ${classRecord.level} (${academicYear.label}).`,
        data: assignment,
      });
    } catch (error) {
      console.error("[teacherService.assignClassTeacher]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },
 
  // ----------------------------------------------------------------
  // GET TEACHER ASSIGNMENTS (timetable view)
  // GET /schools/:schoolId/teachers/:employeeNumber/assignments?termPeriod=FIRST
  // ----------------------------------------------------------------
  async getAssignments(schoolId: string, employeeNumber: string, termPeriod?: TermPeriod) {
    console.log("teacher number",employeeNumber)
    try {
      let teacher: { id: string; firstName: string; lastName: string; employeeNumber: string };
      try {
        teacher = await resolveTeacher(schoolId, employeeNumber);
      } catch (err) {
        if (err instanceof ResolverError) {
          return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        throw err;
      }
 
      // Optionally scope subject assignments to one term
      let termId: string | undefined;
      if (termPeriod) {
        try {
          const term = await resolveTermByPeriod(schoolId, termPeriod);
          termId = term.id;
        } catch {
          // Non-fatal — just return all if term not found
        }
      }
 
      const [subjectAssignments, classAssignment] = await Promise.all([
        prisma.subjectTeacher.findMany({
          where: { teacherId: teacher.id, ...(termId ? { termId } : {}) },
          include: {
            subject: { select: { name: true, code: true } },
            class:   { select: { level: true } },
            term:    {
              select: {
                period: true,
                academicYear: { select: { label: true } },
              },
            },
          },
          orderBy: { assignedAt: "desc" },
        }),
        prisma.teacherClassAssignment.findFirst({
          where: { teacherId: teacher.id },
          include: { class: { select: { level: true } } },
        }),
      ]);
 
      return NextResponse.json({
        data: { teacher, subjectAssignments, classAssignment },
      });
    } catch (error) {
      console.error("[teacherService.getAssignments]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },
 
  // ----------------------------------------------------------------
  // LIST TEACHERS
  // GET /schools/:schoolId/teachers?department=SCIENCE&search=ayo
  // ----------------------------------------------------------------
  async listAllTeachers(req: NextRequest, schoolId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const page       = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
      const limit      = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
      const search     = searchParams.get("search")     ?? undefined;
 
      const where: any = { schoolId };
      if (search) {
        where.OR = [
          { firstName:      { contains: search, mode: "insensitive" } },
          { lastName:       { contains: search, mode: "insensitive" } },
          { employeeNumber: { contains: search, mode: "insensitive" } },
        ];
      }
 
      const [total, teachers] = await Promise.all([
        prisma.teacherProfile.count({ where }),
        prisma.teacherProfile.findMany({
          where,
          ...paginationArgs(page, limit),
          orderBy: { lastName: "asc" },
          include: {
            user: { select: { email: true, userCode: true, status: true } },
          },
        }),
      ]);
      console.log("teachers", teachers)
      return NextResponse.json({
        data: teachers,
        meta: buildPaginationMeta(total, page, limit),
      });
    } catch (error) {
      console.error("[teacherService.list]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },

  async manageAttendance(req: NextRequest, userId: string,  classId: string) {
    try {
      const teacherProfile = await prisma.teacherProfile.findUnique(
          {
              where: { userId },
              select: { id: true, schoolId: true }
          }
      );
      if(!teacherProfile){
          return NextResponse.json(
              { error: "No teacher record found" },
              { status: 404 }
          )
      }
       // Authorization: only the class's assigned teacher can mark its attendance.
      const assignment = await prisma.teacherClassAssignment.findUnique({
        where: { teacherId: teacherProfile.id },
        select: { classId: true },
      });
      if (!assignment || assignment.classId !== classId) {
        return NextResponse.json(
          { error: 'You are not the class teacher for this class.' },
          { status: 403 },
        );
      }
  
      // Resolve target date — default to today, normalized to midnight so the
      // unique constraint (classId, date, label) matches consistently across
      // requests made at different times of the same day.
      const { searchParams } = new URL(req.url);
      const dateParam = searchParams.get('date');
      const targetDate = dateParam ? new Date(dateParam) : new Date();
      targetDate.setHours(0, 0, 0, 0);
      const term = await prisma.term.findFirst({
        where: {  isCurrent: true },
        select: { id: true, academicYearId: true },
      });
      if (!term) {
        return NextResponse.json({ error: 'No active term found for this school.' }, { status: 400 });
      }
   
      // Find-or-create today's session for this class.
      const session = await prisma.classSession.upsert({
        where: {
          classId_date_label: {
            classId,
            date: targetDate,
            label: 'daily',
          },
        },
        create: {
          classId,
          termId: term.id,
          teacherId: teacherProfile.id,
          date: targetDate,
          label: 'daily',
          isCompleted: false,
        },
        update: {}, // session already exists for today — leave as-is
        select: { id: true, isCompleted: true, date: true },
      });
   
      // Enrolled students for this class in the current academic year.
      const enrollments = await prisma.enrollment.findMany({
        where: { classId, academicYearId: term.academicYearId },
        select: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentNumber: true
            },
          },
        },
        orderBy: { student: { lastName: 'asc' } },
      });
   
      if (enrollments.length === 0) {
        return NextResponse.json({
          data: { session, roster: [] },
        });
      }
   
      // Existing attendance rows for this session, keyed by studentId for
      // quick lookup while building the roster below.
      const existingAttendance = await prisma.attendance.findMany({
        where: { sessionId: session.id },
        select: { id: true, studentId: true, status: true, remark: true },
      });
      const attendanceByStudent = new Map(existingAttendance.map((a) => [a.studentId, a]));
   
      // Students enrolled but with no Attendance row yet (first time this
      // session has been opened) — create UNMARKED rows for them now so the
      // roster is always complete.
      const missingStudentIds = enrollments
        .map((e) => e.student.id)
        .filter((id) => !attendanceByStudent.has(id));
   
      if (missingStudentIds.length > 0) {
        await prisma.attendance.createMany({
          data: missingStudentIds.map((studentId) => ({
            sessionId: session.id,
            studentId,
            status: 'UNMARKED' as const,
          })),
        });
   
        // Re-fetch only the newly created rows to merge into the map —
        // avoids a second full table scan.
        const created = await prisma.attendance.findMany({
          where: { sessionId: session.id, studentId: { in: missingStudentIds } },
          select: { id: true, studentId: true, status: true, remark: true },
        });
        created.forEach((a) => attendanceByStudent.set(a.studentId, a));
      }
   
      const roster = enrollments.map(({ student }) => {
        const attendance = attendanceByStudent.get(student.id)!;
        return {
          attendanceId: attendance.id,
          studentId: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          admissionNumber: student.studentNumber,
          status: attendance.status,
          remark: attendance.remark,
        };
      });
   
      return NextResponse.json({
        data: { session, roster },
      });
      
    } 
    catch (error) {
      console.error('[attendanceService.getDailyRoster]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
  async updateAttendance(req: NextRequest, teacherId: string, classId: string) {
    try{
      const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: teacherId },
      select: { id: true, userId: true },
    });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found.' }, { status: 404 });
    }
 
    const assignment = await prisma.teacherClassAssignment.findUnique({
      where: { teacherId: teacher.id },
      select: { classId: true },
    });
    console.log(" ids :", teacher.id, teacherId, classId, assignment)
    if (!assignment || assignment.classId !== classId) {
      return NextResponse.json(
        { error: 'You are not the class teacher for this class.' },
        { status: 403 },
      );
    }
 
    const body = await req.json();
    const parsed = markAttendanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const { sessionId, entries } = parsed.data;
 
    // Confirm the session actually belongs to this class — prevents a
    // crafted request from writing attendance into another class's session
    // by guessing/reusing a sessionId.
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      select: { id: true, classId: true },
    });
    if (!session || session.classId !== classId) {
      return NextResponse.json({ error: 'Session not found for this class.' }, { status: 404 });
    }
 
    const updated = await prisma.$transaction(async (tx) => {
      const writes = await Promise.all(
        entries.map((entry) =>
          tx.attendance.update({
            where: { id: entry.attendanceId },
            data: {
              status: entry.status,
              remark: entry.remark ?? null,
              markedById: teacher.id,
            },
          }),
        ),
      );
 
      await tx.classSession.update({
        where: { id: sessionId },
        data: { isCompleted: true },
      });
 
      return writes;
    });
 
    return NextResponse.json({
      message: `Attendance saved for ${updated.length} student(s).`,
      data: { updatedCount: updated.length },
    });
  } 
  catch (error) {
    console.error('[attendanceService.markAttendance]', error);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
    
  },
  async attendanceHistory(req: NextRequest, teacherId: string, classId: string) {
    try{
      const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: teacherId },
        select: { id: true },
      });
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher profile not found.' }, { status: 404 });
      }
    
      const assignment = await prisma.teacherClassAssignment.findUnique({
        where: { teacherId: teacher.id },
        select: { classId: true },
      });
      console.log("assign found", assignment, classId)
      if (!assignment || assignment.classId !== classId) {
        return NextResponse.json(
          { error: 'You are not the class teacher for this class.' },
          { status: 403 },
        );
      }
    
      const { searchParams } = new URL(req.url);
      const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
      const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));
      const from = searchParams.get('from');
      const to = searchParams.get('to');
    
      const where: any = { classId, label: 'daily' };
      if (from || to) {
        where.date = {};
        if (from) where.date.gte = new Date(from);
        if (to) where.date.lte = new Date(to);
      }
    
      const [total, sessions] = await Promise.all([
        prisma.classSession.count({ where }),
        prisma.classSession.findMany({
          where,
          orderBy: { date: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            date: true,
            isCompleted: true,
            attendances: {
              select: { status: true },
            },
          },
        }),
      ]);
    
      const data = sessions.map((session) => {
        const counts = { PRESENT: 0, ABSENT: 0, LATE: 0, UNMARKED: 0 };
        session.attendances.forEach((a) => {
          counts[a.status as keyof typeof counts] += 1;
        });
      
        return {
          sessionId: session.id,
          date: session.date,
          isCompleted: session.isCompleted,
          totalStudents: session.attendances.length,
          counts,
        };
      });
    
      return NextResponse.json({
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } 
    catch (error) {
      console.error('[attendanceService.getHistory]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },

  async getScoreRoster( teacherId: string, classId: string, subjectId: string){
      try{
        const teacher = await prisma.teacherProfile.findUnique({
          where: { userId: teacherId },
          select: { id: true, schoolId: true },
        });
        if (!teacher) {
          return NextResponse.json({ error: 'Teacher profile not found.' }, { status: 404 });
        }
 
    /// Authorization: allowed if the teacher is either the SubjectTeacher
    // for this exact subject+class, OR the class teacher for this class
    // (class teachers have entry/oversight rights across all subjects for
    // their own class, not just ones they personally teach).
    const access = await resolveScoreAccess(teacher.id, classId, subjectId);
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: 'You are not assigned to teach this subject in this class, and are not the class teacher.',
        },
        { status: 403 },
      );
    }
 
    const term = await prisma.term.findFirst({
      where: { isCurrent: true },
      select: { id: true, academicYearId: true, period: true },
    });
    if (!term) {
      return NextResponse.json({ error: 'No active term found for this school.' }, { status: 400 });
    }
 
    const enrollments = await prisma.enrollment.findMany({
      where: { classId, academicYearId: term.academicYearId },
      select: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentNumber: true },
        },
      },
      orderBy: { student: { lastName: 'asc' } },
    });
 
    const studentIds = enrollments.map((e) => e.student.id);
    console.log("student ids", studentIds)
 
    const scores = await prisma.score.findMany({
      where: { studentId: { in: studentIds }, subjectId, termId: term.id },
      select: {
        id: true,
        studentId: true,
        caScore: true,
        examScore: true,
        totalScore: true,
        grade: true,
        gradeRemark: true,
        isPublished: true,
      },
    });
    const scoresByStudent = new Map(scores.map((s) => [s.studentId, s]));
 
    const roster = enrollments.map(({ student }) => {
      const score = scoresByStudent.get(student.id);
      return {
        scoreId: score?.id ?? null, // null means no Score row exists yet
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        admissionNumber: student.studentNumber,
        caScore: score?.caScore ?? null,
        examScore: score?.examScore ?? null,
        totalScore: score?.totalScore ?? null,
        grade: score?.grade ?? null,
        gradeRemark: score?.gradeRemark ?? null,
        isPublished: score?.isPublished ?? false,
      };
    });
 
    const assessmentConfig = await resolveAssessmentConfig(teacher.schoolId);
 
    return NextResponse.json({
      data: {
        termId: term.id,
        termLabel: term.period,
        assessmentConfig,
        roster,
      },
    });
  } catch (error) {
    console.error('[scoreService.getRoster]', error);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
      
  },

  async updateScoreRoster(req: NextRequest, teacherId: string, classId:string, subjectId: string) {
      try{
        const teacher = await prisma.teacherProfile.findUnique({
          where: { userId: teacherId },
          select: { id: true, schoolId: true },
        });
        if (!teacher) {
          return NextResponse.json({ error: 'Teacher profile not found.' }, { status: 404 });
        }
 
        // Authorization: allowed if the teacher is either the SubjectTeacher
        // for this exact subject+class, OR the class teacher for this class.
        // See resolveScoreAccess for the full rationale — kept as one shared
        // resolver so this can't drift from the GET roster endpoint's check.
        const access = await resolveScoreAccess(teacher.id, classId, subjectId);
        if (!access.allowed) {
          return NextResponse.json(
            {
              error:
                'You are not assigned to teach this subject in this class, and are not the class teacher.',
            },
            { status: 403 },
          );
        }
 
        const term = await prisma.term.findFirst({
          where: { isCurrent: true },
          select: { id: true },
        });
        if (!term) {
          return NextResponse.json({ error: 'No active term found for this school.' }, { status: 400 });
        }
 
        const body = await req.json();
        const parsed = saveScoresSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
            { status: 400 },
          );
        }
        const { field, entries } = parsed.data;
      
        // Validate against the school's configured ceiling for this field
        // (CA max / Exam max) before writing anything.
        const { caMaxScore, examMaxScore } = await resolveAssessmentConfig(teacher.schoolId);
        const ceiling = field === 'caScore' ? caMaxScore : examMaxScore;
      
        const overLimit = entries.filter((e) => e.value > ceiling);
        if (overLimit.length > 0) {
          return NextResponse.json(
            {
              error: `${entries.length === overLimit.length ? 'Scores' : 'Some scores'} exceed the maximum of ${ceiling} for ${
                field === 'caScore' ? 'CA' : 'Exam'
              }.`,
              details: { invalidStudentIds: overLimit.map((e) => e.studentId) },
            },
            { status: 400 },
          );
        }
      
        // Confirm every studentId is actually enrolled in this class for the
        // current term — guards against writing scores for students who
        // transferred out or were never in this class.
        const validEnrollments = await prisma.enrollment.findMany({
          where: {
            studentId: { in: entries.map((e) => e.studentId) },
            classId,
          },
          select: { studentId: true },
        });
        const validStudentIds = new Set(validEnrollments.map((e) => e.studentId));
        const invalidEntries = entries.filter((e) => !validStudentIds.has(e.studentId));
        if (invalidEntries.length > 0) {
          return NextResponse.json(
            { error: 'One or more students are not enrolled in this class.' },
            { status: 400 },
          );
        }
 
        // Block edits to any score the school has already published — a
        // published result has been finalized and shared with students/parents,
        // so silently overwriting it here would be invisible and confusing.
        // The whole batch is rejected rather than partially applied, so the
        // teacher gets one clear error instead of a half-saved grid.
        const publishedConflicts = await prisma.score.findMany({
          where: {
            studentId: { in: entries.map((e) => e.studentId) },
            subjectId,
            termId: term.id,
            isPublished: true,
          },
          select: { studentId: true },
        });
        if (publishedConflicts.length > 0) {
          return NextResponse.json(
            {
              error: 'Some scores are already published and cannot be edited. Contact an admin to unpublish first.',
              details: { studentIds: publishedConflicts.map((c) => c.studentId) },
            },
            { status: 409 },
          );
        }
      
        const results = await prisma.$transaction(async (tx) => {
          const written = [];
        
          for (const entry of entries) {
            // Upsert by the (studentId, subjectId, termId) composite unique
            // key — creates the Score row on first entry, updates it after.
            const existing = await tx.score.upsert({
              where: {
                studentId_subjectId_termId: {
                  studentId: entry.studentId,
                  subjectId,
                  termId: term.id,
                },
              },
              create: {
                studentId: entry.studentId,
                subjectId,
                termId: term.id,
                enteredById: teacher.id,
                [field]: entry.value,
              },
              update: {
                [field]: entry.value,
                enteredById: teacher.id,
              },
              select: { id: true, caScore: true, examScore: true },
            });
          
            // Recompute total + grade now that this field has changed.
            const { totalScore, grade, gradeRemark } = await computeTotalAndGrade(
              teacher.schoolId,
              existing.caScore,
              existing.examScore,
            );
          
            const updated = await tx.score.update({
              where: { id: existing.id },
              data: { totalScore, grade, gradeRemark },
              select: { id: true, studentId: true, totalScore: true, grade: true },
            });
          
            written.push(updated);
          }
        
          return written;
        });
      
        return NextResponse.json({
          message: `${results.length} ${field === 'caScore' ? 'CA' : 'Exam'} score(s) saved.`,
          data: { updated: results },
        });
      } 
      catch (error) {
        console.error('[scoreService.saveScores]', error);
        return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
      }
  },

  async getScoreHistory(req: NextRequest, teacherId: string, subjectId: string, classId: string) {
      try {
        const teacher = await prisma.teacherProfile.findUnique({
          where: { userId: teacherId },
          select: { id: true },
        });
        if (!teacher) {
          return NextResponse.json({ error: 'Teacher profile not found.' }, { status: 404 });
        }
      
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));

        if (!classId) {
          return NextResponse.json({ error: 'classId is required.' }, { status: 400 });
        }
      
        //Authorization: allowed if the teacher has EVER been assigned to this
        //subject+class combo (any term — broader than "currently assigned",
        //since history should remain visible after a reassignment), OR if
        //they are the CURRENT class teacher for this class. Class teachers
        //get oversight across all subjects for their own class, including
        //history, even for subjects they've never personally taught.
        const [everTaught, classAssignment] = await Promise.all([
          prisma.subjectTeacher.findFirst({
            where: { teacherId: teacher.id, classId, subjectId },
            select: { id: true },
          }),
          prisma.teacherClassAssignment.findUnique({
            where: { teacherId: teacher.id },
            select: { classId: true },
          }),
        ]);
      
        const isClassTeacher = classAssignment?.classId === classId;
      
        if (!everTaught && !isClassTeacher) {
           return NextResponse.json(
          {
            error:
              'You have not been assigned to teach this subject in this class, and are not the class teacher.',
            },
            { status: 403 },
          );
        }
      
        //Students who have ever been enrolled in this class — scores are
        //joined against term, not the live current-enrollment list, since
        //history should show what happened even for students who've since
        //moved on.
        const where = {
          subjectId,
          student: {
            enrollments: { some: { classId } },
          },
        };
      
        const [total, scores] = await Promise.all([
          prisma.score.count({ where }),
          prisma.score.findMany({
            where,
            orderBy: [{ term: { startDate: 'desc' } }, { student: { lastName: 'asc' } }],
            skip: (page - 1) * limit,
            take: limit,
            select: {
              id: true,
              caScore: true,
              examScore: true,
              totalScore: true,
              grade: true,
              gradeRemark: true,
              isPublished: true,
              updatedAt: true,
              term: { select: { id: true, period: true } },
              student: {
                select: { id: true, firstName: true, lastName: true, studentNumber: true },
              },
            },
          }),
        ]);
      
        return NextResponse.json({
          data: scores,
          meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
      } 
      catch (error) {
        console.error('[scoreService.getHistory]', error);
        return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
      }
  },
  
  async getMySubjects(teacherId: string, classId: string) {
      try{
        const teacher = await prisma.teacherProfile.findUnique({
          where: { userId: teacherId},
          select: { id: true },
        });
        if (!teacher) {
          return NextResponse.json({ error: 'Teacher profile not found.' }, { status: 404 });
        }
 
        const classAssignment = await prisma.teacherClassAssignment.findUnique({
          where: { teacherId: teacher.id },
          select: { classId: true },
        });
        const isClassTeacher = classAssignment?.classId === classId;
      
        if (isClassTeacher) {
          // Full subject list for the class — including subjects with no
          // teacher assigned at all, so the class teacher can fill the gap.
          const subjects = await prisma.subject.findMany({
            where: { classId },
            select: {
              id: true,
              name: true,
              code: true,
              subjectTeachers: {
                select: {
                  teacher: {
                    select: { id: true, firstName: true, lastName: true },
                  },
                },
                take: 1, // current model is one teacher per subject per class
              },
            },
            orderBy: { name: 'asc' },
          });
        
          const data = subjects.map((s) => ({
            subjectId: s.id,
            name: s.name,
            code: s.code,
            assignedTeacher: s.subjectTeachers[0]?.teacher
              ? `${s.subjectTeachers[0].teacher.firstName} ${s.subjectTeachers[0].teacher.lastName}`
              : null,
            isPersonallyAssigned: s.subjectTeachers[0]?.teacher?.id === teacher.id,
          }));
        
          return NextResponse.json({ data, meta: { accessLevel: 'class_teacher' } });
        }
      
        // Not the class teacher — only subjects this teacher personally teaches
        // in this class.
        const assignments = await prisma.subjectTeacher.findMany({
          where: { teacherId: teacher.id, classId },
          select: {
            subject: { select: { id: true, name: true, code: true } },
          },
          orderBy: { subject: { name: 'asc' } },
        });
      
        const data = assignments.map((a) => ({
          subjectId: a.subject.id,
          name: a.subject.name,
          code: a.subject.code,
          assignedTeacher: null, // not relevant in this view — it's always "you"
          isPersonallyAssigned: true,
        }));
      
        return NextResponse.json({ data, meta: { accessLevel: 'subject_teacher' } });
      } 
      catch (error) {
        console.error('[teacherService.getMySubjectsForClass]', error);
        return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
      }
  },

  async getScoreSheet(teacherId: string, classId: string) {
    try{
       const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: teacherId},
        select: { id: true, schoolId: true },
      });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found.' }, { status: 404 });
    }
 
    // Authorization: class teacher only — this is a privileged cross-subject
    // view. Subject teachers use the per-subject roster endpoint instead.
    const classAssignment = await prisma.teacherClassAssignment.findUnique({
      where: { teacherId: teacher.id },
      select: { classId: true },
    });
    if (classAssignment?.classId !== classId) {
      return NextResponse.json(
        { error: 'Only the class teacher can view the full score sheet.' },
        { status: 403 },
      );
    }
 
    const term = await prisma.term.findFirst({
      where: { isCurrent: true },
      select: { id: true, academicYearId: true, period: true },
    });
    if (!term) {
      return NextResponse.json(
        { error: 'No active term found for this school.' },
        { status: 400 },
      );
    }
 
    // Fetch subjects, enrollments, and scores in parallel — independent
    // queries, no reason to sequence them.
    const [subjects, enrollments, scores] = await Promise.all([
      prisma.subject.findMany({
        where: { classId },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
      prisma.enrollment.findMany({
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
      }),
      prisma.score.findMany({
        where: {
          termId: term.id,
          subject: { classId },
        },
        select: {
          studentId: true,
          subjectId: true,
          caScore: true,
          examScore: true,
          totalScore: true,
          grade: true,
          isPublished: true,
        },
      }),
    ]);
 
    // Index scores by `${studentId}:${subjectId}` for O(1) lookup
    // while building the matrix below.
    const scoreIndex = new Map(
      scores.map((s) => [`${s.studentId}:${s.subjectId}`, s]),
    );
 
    const students = enrollments.map(({ student }) => ({
      studentId: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentNumber: student.studentNumber,
      scores: Object.fromEntries(
        subjects.map((subject) => {
          const key = `${student.id}:${subject.id}`;
          const score = scoreIndex.get(key);
          return [
            subject.id,
            score
              ? {
                  caScore: score.caScore,
                  examScore: score.examScore,
                  totalScore: score.totalScore,
                  grade: score.grade,
                  isPublished: score.isPublished,
                }
              : null,
          ];
        }),
      ),
    }));
 
    return NextResponse.json({
      data: {
        subjects: subjects.map((s) => ({ id: s.id, name: s.name, code: s.code })),
        students,
        meta: { termId: term.id, term: term.period },
      },
    });
  } catch (error) {
    console.error('[scoreService.getScoreSheet]', error);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
    
  },
}
