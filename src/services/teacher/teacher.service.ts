import { prisma } from "@/src/lib/prisma/client";
import { buildPaginationMeta, paginationArgs } from "@/src/utils/pagination";
import { resolveAcademicYear, resolveClass, ResolverError, resolveSubject, resolveTeacher, resolveTerm, resolveTermByPeriod } from "@/src/utils/resolvers";
import { assignClassTeacherSchema, assignSubjectToTeacherSchema } from "@/src/validators/teacherSchema";
import { NextRequest, NextResponse } from "next/server";

export const teacherServices = {
    async assignSubject(req: NextRequest, schoolId: string, employeeNumber: string) {
    try {
        const body = await req.json();
        const parsed = assignSubjectToTeacherSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { subjectName, className, termPeriod } = parsed.data;

        let teacher:     { id: string };
        let classRecord: { id: string; name: string; level: string; department: string | null };
        let term:        { id: string };

        try {
            // ── Step 1: resolve teacher + class in parallel (neither depends on the other)
            [teacher, classRecord] = await Promise.all([
                resolveTeacher(schoolId, employeeNumber),
                prisma.class.findFirst({
                    where:  { schoolId, name: className },
                    select: { id: true, name: true, level: true, department: true },
                }).then((c) => {
                    if (!c) throw new ResolverError(`Class "${className}" not found in this school.`);
                    return c;
                }),
            ]);

            // ── Step 2: resolve term (independent of subject/class)
            term = termPeriod
                ? await resolveTermByPeriod(schoolId, termPeriod)
                : await resolveTerm(schoolId);

        } catch (err) {
            if (err instanceof ResolverError) {
                return NextResponse.json({ error: err.message }, { status: err.statusCode });
            }
            throw err;
        }

        const assignment = await prisma.$transaction(async (tx) => {
            // ── Step 3: find or create the Subject scoped to this class
            // Subject identity is now (classId, name) — not (schoolId, name, teacherId)
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
            });

            return { subject, record };
        });

        return NextResponse.json({
            message:  `"${subjectName}" assigned to ${employeeNumber} for ${className}.`,
            data: assignment,
        });

    } catch (error) {
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
    employeeNumber: string
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
 
      const { subjectName, className, termPeriod } = parsed.data;
 
      let teacher: { id: string };
      let subject: { id: string };
      let classRecord;
      let term:    { id: string };
 
      try {
        [teacher, subject] = await Promise.all([
          resolveTeacher(schoolId, employeeNumber),
          resolveSubject(schoolId, subjectName),
          
        ]);
        classRecord = await prisma.class.findFirst({
            where: { schoolId, name: className },
            select: { id: true, name: true, level: true, department: true },
        });
        if (!classRecord) {
          throw new ResolverError(
            `Class with name:"${className}" not found in this school.`
          );
        }
        term = termPeriod
          ? await resolveTermByPeriod(schoolId, termPeriod)
          : await resolveTerm(schoolId);
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
          classId:   classRecord.id,
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
  async assignClassTeacher(req: NextRequest, schoolId: string, className: string) {
    try {
      const body = await req.json();
      const parsed = assignClassTeacherSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
 
      const { teacherEmployeeNumber, isClassTeacher, academicYearLabel } = parsed.data;
 
      let teacher:      { id: string };
      let classRecord:          { id: string; name: string };
      let academicYear: { id: string; label: string };
 
      try {
        [teacher, academicYear] = await Promise.all([
          resolveTeacher(schoolId, teacherEmployeeNumber),
          resolveAcademicYear(schoolId, academicYearLabel),
        ]);
 
        const c = await prisma.class.findFirst({
          where: { schoolId, name: className },
          select: { id: true, name: true },
        });
        if (!c) throw new ResolverError(`Class "${className}" not found.`);
        classRecord = c;
      } catch (err) {
        if (err instanceof ResolverError) {
          return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        throw err;
      }
 
      const assignment = await prisma.teacherClassAssignment.upsert({
        where: {
          teacherId_classId_academicYearId: {
            teacherId:      teacher.id,
            classId:        classRecord.id,
            academicYearId: academicYear.id,
          },
        },
        create: {
          teacherId:      teacher.id,
          classId:        classRecord.id,
          academicYearId: academicYear.id,
          isClassTeacher,
        },
        update: { isClassTeacher },
      });
 
      return NextResponse.json({
        message: `${teacherEmployeeNumber} assigned to ${classRecord.name} (${academicYear.label}).`,
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
  async getAssignments(schoolId: string, employeeNumber: string, termPeriod?: string) {
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
          const term = await resolveTermByPeriod(schoolId, termPeriod as any);
          termId = term.id;
        } catch {
          // Non-fatal — just return all if term not found
        }
      }
 
      const [subjectAssignments, classAssignments] = await Promise.all([
        prisma.subjectTeacher.findMany({
          where: { teacherId: teacher.id, ...(termId ? { termId } : {}) },
          include: {
            subject: { select: { name: true, code: true } },
            class:   { select: { name: true, level: true } },
            term:    {
              select: {
                period: true,
                academicYear: { select: { label: true } },
              },
            },
          },
          orderBy: { assignedAt: "desc" },
        }),
        prisma.teacherClassAssignment.findMany({
          where: { teacherId: teacher.id },
          include: { class: { select: { name: true, level: true } } },
        }),
      ]);
 
      return NextResponse.json({
        data: { teacher, subjectAssignments, classAssignments },
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
  async list(req: NextRequest, schoolId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const page       = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
      const limit      = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
      const search     = searchParams.get("search")     ?? undefined;
      const department = searchParams.get("department") ?? undefined;
 
      const where: any = { schoolId, deletedAt: null };
      if (department) where.department = department;
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
 
      return NextResponse.json({
        data: teachers,
        meta: buildPaginationMeta(total, page, limit),
      });
    } catch (error) {
      console.error("[teacherService.list]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },
};
