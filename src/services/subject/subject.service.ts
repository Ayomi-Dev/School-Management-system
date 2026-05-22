// ============================================================
// SUBJECT SERVICE
// schoolId from session; teacherId assigned separately via the
// teacher service assignSubject endpoint.
// ============================================================

import { prisma } from "@/src/lib/prisma/client";
import { createSubjectSchema, updateSubjectSchema } from "@/src/validators/classSchema";
import { NextRequest, NextResponse } from "next/server";

export const subjectService = {
  async createSubject(req: NextRequest, schoolId: string) {
    try {
      const body = await req.json();
      const parsed = createSubjectSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { name, code } = parsed.data;

      // Subject names must be unique per school (teacherId is optional at creation,
      // so we only check schoolId + name here)
      const existing = await prisma.subject.findFirst({
        where: { schoolId, name },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Subject "${name}" already exists in this school.` },
          { status: 409 }
        );
      }

      // teacherId is required in the schema but we allow a placeholder here —
      // the DB schema has teacherId as required, so we create a temporary stub
      // and the admin must assign a teacher via teacherService.assignSubject.
      // To work around this without a DB migration, we create the subject only
      // after at least one teacher exists and can be set as default.
      //
      // Alternative: find the school's first teacher as a default placeholder.
      const anyTeacher = await prisma.teacherProfile.findFirst({
        where: { schoolId, deletedAt: null },
        select: { id: true },
      });

      if (!anyTeacher) {
        return NextResponse.json(
          {
            error:
              "At least one teacher must exist before creating subjects. " +
              "Create a teacher first.",
          },
          { status: 422 }
        );
      }

      const subject = await prisma.subject.create({
        data: {
          schoolId,
          name,
          code,
          teacherId: anyTeacher.id,  // placeholder — overwritten on assignment
        },
      });

      return NextResponse.json(
        { message: "Subject created.", data: subject },
        { status: 201 }
      );
    } catch (error) {
      console.error("[subjectService.create]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },

  async listAllSubjects(schoolId: string) {
    try {
      const subjects = await prisma.subject.findMany({
        where: { schoolId },
        orderBy: { name: "asc" },
        include: {
          teacher: {
            select: { firstName: true, lastName: true, employeeNumber: true },
          },
        },
      });
      return NextResponse.json({ data: subjects });
    } catch (error) {
      console.error("[subjectService.list]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },

  async update(req: NextRequest, subjectId: string, schoolId: string) {
    try {
      const body = await req.json();
      const parsed = updateSubjectSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, schoolId },
        select: { id: true },
      });
      if (!subject) {
        return NextResponse.json({ error: "Subject not found." }, { status: 404 });
      }

      const updated = await prisma.subject.update({
        where: { id: subjectId },
        data: parsed.data,
      });

      return NextResponse.json({ message: "Subject updated.", data: updated });
    } catch (error) {
      console.error("[subjectService.update]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },
};