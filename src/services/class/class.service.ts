import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma/client";
import { createClassSchema, updateClassSchema, createSubjectSchema, updateSubjectSchema } from "@/src/validators/classSchema";
import { resolveAcademicYear, resolveClass, ResolverError } from "@/src/utils/resolvers";
import { ClassLevel, Department } from "@/src/types/types";
import { currentSession } from "@/src/utils/userCode";
import { _levelOrder } from "@/src/utils/levelOrder";

// ============================================================
// CLASS SERVICE
// Handles class creation, update, listing, and subject management.
// schoolId always comes from the authenticated session / route
// param — never from the request body.
// ============================================================

export const classService = {
  // ----------------------------------------------------------------
  // CREATE CLASS
  // Called by admin via POST /schools/:schoolId/classes
  // Also called internally during student creation when no matching
  // class exists (if createIfMissing=true).
  // ----------------------------------------------------------------
  async createClass(req: NextRequest, schoolId: string) {
    try {
      const body = await req.json();
      return await classService._createFromData(body, schoolId);
    } catch (error) {
      if (error instanceof ResolverError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }
      console.error("[classService.create]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },

  /**
   * Internal: accepts a plain object instead of a NextRequest.
   * Used by studentService.create so it can participate in the
   * same service call without needing a second HTTP request.
   */
  async _createFromData(
    data: unknown, 
    schoolId: string) {
    const parsed = createClassSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { level, department } = parsed.data;

    // Unique: one class name per school
    const existingClass = await prisma.class.findFirst({
      where: { schoolId, level },
      select: { id: true, level: true}
    })
    if(!existingClass){
      return NextResponse.json(
        { error: `Class "${level}" already exists in this school.` },
        { status: 409 }
      );
    }
    const order = _levelOrder(level)

    const classLevel = await prisma.class.create({
      data: { 
        schoolId, 
        level, order, 
        ...(department ? { department } : {}),
      }
    })
    ;

    return NextResponse.json(
      { message: "Class created.", data: classLevel },
      { status: 201 }
    );
  },

  // ----------------------------------------------------------------
  // GET OR CREATE  (used by student provisioning pipeline)
  // Finds a class by name+schoolId, or creates it on the fly when
  // createIfMissing=true. Returns the raw Prisma record (not a
  // NextResponse) because this is an internal utility.
  // ----------------------------------------------------------------
  async getOrCreate(
    tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
    schoolId: string,
    level: ClassLevel,
    order: number,
    department?: Department,
  ): Promise<{ id: string; level: string; isNew: boolean }> {
    const classRecord = await resolveClass(tx, schoolId, level)
    console.log("resolving class")
    if (classRecord?.level === level) {
      // Validate the level matches what we expect
      console.log("class exist but code didnt break")
      return { ...classRecord, isNew: false };
    }

    const levelClass = await prisma.class.create({
      data: {
        schoolId,
        level,
        order,
        ...(department ? { department } : {}),
      },
      select: { id: true, level: true },
    });

    return { ...levelClass, isNew: true };
  },

  // ----------------------------------------------------------------
  // UPDATE CLASS
  // ----------------------------------------------------------------
  async updateClass(req: NextRequest, classId: string, schoolId: string) {
    try {
      const body = await req.json();
      const parsed = updateClassSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const existing = await prisma.class.findFirst({
        where: { id: classId, schoolId },
        select: { id: true },
      });
      if (!existing) {
        return NextResponse.json({ error: "Class not found." }, { status: 404 });
      }

      const {level, department } = parsed.data
      // If renaming, check new name isn't already taken
      if (level) {
        const nameTaken = await prisma.class.findFirst({
          where: { schoolId, level, id: { not: classId } },
          select: { id: true },
        });
        if (nameTaken) {
          return NextResponse.json(
            { error: `Another class named "${level}" already exists.` },
            { status: 409 }
          );
        }
      }

      const updated = await prisma.class.update({
        where: { id: classId },
        data: {
          level,
          ...(department && { department })
        }
      });

      return NextResponse.json({ message: "Class updated.", data: updated });
    } catch (error) {
      console.error("[classService.update]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },

  // ----------------------------------------------------------------
  // LIST CLASSES
  // ----------------------------------------------------------------
  async classList(req: NextRequest, schoolId: string,) {
    try {
      const { searchParams } = new URL(req.url);
      const level      = searchParams.get("level")      ?? undefined;
      const department = searchParams.get("department") ?? undefined;

      const where: any = { schoolId };
      if (level)      where.level      = level;
      if (department) where.department = department;

      const classes = await prisma.class.findMany({
        where,
        orderBy: [{ order: "asc" }, { level: "asc" }],
        include: {
          subjectTeachers: { 
            select: { 
              subject: true, subjectId: true, 
              teacher: { select: {firstName: true, lastName: true}}, 
              teacherId: true
            }
          },
          enrollments: {
            select: { academicYearId: true, academicYear: true},
          },
          teacherAssignments: { 
            select: {id: true, teacherId: true, teacher: true}
          },
          _count: {
            select: { enrollments: true, subjectTeachers: true, subjects: true },
          },
        },
      });
      return NextResponse.json({ data: classes });
    } catch (error) {
      console.error("[classService.list]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },

  // ----------------------------------------------------------------
  // GET CLASS WITH STUDENTS (for a given academic year)
  // ----------------------------------------------------------------
  async getClassWithStudents(
    classId: string,
    schoolId: string,
    academicYearLabel?: string
  ) {
    try {
      const classLevel = await prisma.class.findFirst({
        where: { id: classId, schoolId },
        select: { id: true, level: true, department: true },
      });
      if (!classLevel) {
        return NextResponse.json({ error: "Class not found." }, { status: 404 });
      }
 
      // Resolve academic year
      const yearLabel = currentSession()
      const academicYear = await resolveAcademicYear(schoolId, yearLabel)
      if (!academicYear) {
        return NextResponse.json(
          { error: "Academic year not found." },
          { status: 404 }
        );
      }

      const enrollments = await prisma.enrollment.findMany({
        where: { classId, academicYearId: academicYear.id },
        include: {
          student: {
            select: {
              id: true,
              studentNumber: true,
              firstName: true,
              lastName: true,
              gender: true,
              status: true,
              user: { select: { userCode: true, status: true } },
            },
          },
        },
        orderBy: { student: { lastName: "asc" } },
      });

      return NextResponse.json({
        data: {
          class: classLevel,
          academicYear,
          studentCount: enrollments.length,
          students: enrollments.map((e) => e.student),
        },
      });
    } catch (error) {
      console.error("[classService.getWithStudents]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },
};

