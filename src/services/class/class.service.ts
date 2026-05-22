import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma/client";
import { createClassSchema, updateClassSchema, createSubjectSchema, updateSubjectSchema } from "@/src/validators/classSchema";
import { ResolverError } from "@/src/utils/resolvers";
import { ClassLevel, Department } from "@/src/types/types";

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
  async _createFromData(data: unknown, schoolId: string) {
    const parsed = createClassSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, level, order, department } = parsed.data;

    // Unique: one class name per school
    const existing = await prisma.class.findFirst({
      where: { schoolId, name },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Class "${name}" already exists in this school.` },
        { status: 409 }
      );
    }

    const classLevel = await prisma.class.create({
      data: { schoolId, name, level, order, department },
    });

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
    schoolId: string,
    name: string,
    level: ClassLevel,
    order: number,
    department?: Department,
    createIfMissing = false
  ): Promise<{ id: string; name: string; level: string; isNew: boolean }> {
    const existing = await prisma.class.findFirst({
      where: { schoolId, name },
      select: { id: true, name: true, level: true },
    });

    if (existing) {
      // Validate the level matches what we expect
      if (existing.level !== level) {
        throw new ResolverError(
          `Class "${name}" exists but is level "${existing.level}", not "${level}". ` +
          `Fix the level mismatch or choose a different class name.`,
          409
        );
      }
      return { ...existing, isNew: false };
    }

    if (!createIfMissing) {
      throw new ResolverError(
        `Class "${name}" not found. Create it first or set createIfMissing=true.`
      );
    }

    const levelClass = await prisma.class.create({
      data: {
        schoolId,
        name,
        level,
        order,
        ...(department ? { department } : {}),
      },
      select: { id: true, name: true, level: true },
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

      // If renaming, check new name isn't already taken
      if (parsed.data.name) {
        const nameTaken = await prisma.class.findFirst({
          where: { schoolId, name: parsed.data.name, id: { not: classId } },
          select: { id: true },
        });
        if (nameTaken) {
          return NextResponse.json(
            { error: `Another class named "${parsed.data.name}" already exists.` },
            { status: 409 }
          );
        }
      }

      const updated = await prisma.class.update({
        where: { id: classId },
        data: parsed.data,
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
  async classList(schoolId: string, req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const level      = searchParams.get("level")      ?? undefined;
      const department = searchParams.get("department") ?? undefined;

      const where: any = { schoolId };
      if (level)      where.level      = level;
      if (department) where.department = department;

      const classes = await prisma.class.findMany({
        where,
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: {
          _count: {
            select: { enrollments: true, subjectTeachers: true },
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
        select: { id: true, name: true, level: true, department: true },
      });
      if (!classLevel) {
        return NextResponse.json({ error: "Class not found." }, { status: 404 });
      }

      // Resolve academic year
      const yearWhere: any = { schoolId };
      if (academicYearLabel) yearWhere.label = academicYearLabel;
      else yearWhere.isCurrent = true;

      const academicYear = await prisma.academicYear.findFirst({
        where: yearWhere,
        select: { id: true, label: true },
      });

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

