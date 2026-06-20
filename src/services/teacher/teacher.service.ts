import { prisma } from "@/src/lib/prisma/client";
import { ClassLevel, Department, TermPeriod } from "@/src/types";
import { buildPaginationMeta, paginationArgs } from "@/src/utils/pagination";
import { resolveAcademicYear, resolveClassByName, ResolverError, resolveSubject, resolveTeacher, resolveTerm, resolveTermByPeriod } from "@/src/utils/resolvers";
import { markAttendanceSchema } from "@/src/validators/attendanceSchema";
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
              studentNumber: true, // adjust field name if different on StudentProfile
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
      select: { id: true },
    });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found.' }, { status: 404 });
    }
 
    const assignment = await prisma.teacherClassAssignment.findUnique({
      where: { teacherId: teacher.id },
      select: { classId: true },
    });
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
   }
}
