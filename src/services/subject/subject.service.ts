// ============================================================
// SUBJECT SERVICE
// schoolId from session; teacherId assigned separately via the
// teacher service assignSubject endpoint.
// ============================================================

import { prisma } from "@/src/lib/prisma/client";
import { resolveClassByName } from "@/src/utils/resolvers";
import { createSubjectSchema, updateSubjectSchema } from "@/src/validators/subjectSchema";
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

      const { name, code, className } = parsed.data;

      // ── Resolve the class this subject belongs to ─────────────────
      const classRecord = await resolveClassByName(schoolId, className as string);
      if (!classRecord) {
        return NextResponse.json(
          { error: `Class "${className}" not found in this school.` },
          { status: 404 }
        );
      }

      // ── Guard: subject name must be unique within a class ─────────
      // Two classes can both have "Mathematics" — that's fine.
      // The same class cannot have two "Mathematics" rows.
      const existing = await prisma.subject.findUnique({
        where: {
          classId_name: { classId: classRecord.id, name },
        },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Subject "${name}" already exists for class "${className}".` },
          { status: 409 }
        );
      }

      // ── Create the subject scoped to this class ───────────────────
      // No teacher at creation time — teacher assignment happens via
      // teacherService.assignSubject which writes to SubjectTeacher
      const subject = await prisma.subject.create({
        data: { schoolId, classId: classRecord.id, name, code: code ?? null },
        select: {
          id:      true,
          name:    true,
          code:    true,
          classId: true,
          class:   { select: { name: true, level: true } },
        },
      });

      return NextResponse.json(
        { message: "Subject created.", data: subject },
        { status: 201 }
      );
    } catch (error) {
      console.error("[subjectService.createSubject]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },

  // ── List all subjects for a school ─────────────────────────────────
  // Groups by class and includes currently assigned teachers via
  // SubjectTeacher — not a direct field on Subject anymore
  async listAllSubjects(schoolId: string) {
    try {
      const subjects = await prisma.subject.findMany({
        where:   { schoolId },
        orderBy: [{ class: { level: "asc" } }, { name: "asc" }],
        select: {
          id:   true,
          name: true,
          code: true,
          class: {
            select: { id: true, name: true, level: true },
          },
          // All teacher assignments for this subject across terms
          subjectTeachers: {
            select: {
              termId:  true,
              teacher: {
                select: {
                  id:             true,
                  firstName:      true,
                  lastName:       true,
                  employeeNumber: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({ data: subjects });
    } catch (error) {
      console.error("[subjectService.listAllSubjects]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },

  // ── Update a subject's name or code ────────────────────────────────
  // className can also be passed to move a subject to a different class,
  // with a duplicate-name guard on the target class
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

      const { name, code, className } = parsed.data;

      // ── Verify subject belongs to this school ─────────────────────
      const subject = await prisma.subject.findFirst({
        where:  { id: subjectId, schoolId },
        select: { id: true, name: true, classId: true },
      });
      if (!subject) {
        return NextResponse.json({ error: "Subject not found." }, { status: 404 });
      }

      // ── Optionally resolve a new class ────────────────────────────
      let targetClassId = subject.classId; // default: stay in current class

      if (className) {
        const classRecord = await prisma.class.findFirst({
          where:  { schoolId, name: className },
          select: { id: true },
        });
        if (!classRecord) {
          return NextResponse.json(
            { error: `Class "${className}" not found in this school.` },
            { status: 404 }
          );
        }
        targetClassId = classRecord.id;
      }

      // ── Guard: new name must not clash in the target class ────────
      if (name && name !== subject.name) {
        const clash = await prisma.subject.findUnique({
          where: {
            classId_name: { classId: targetClassId, name },
          },
          select: { id: true },
        });
        if (clash) {
          return NextResponse.json(
            { error: `Subject "${name}" already exists in that class.` },
            { status: 409 }
          );
        }
      }

      const updated = await prisma.subject.update({
        where: { id: subjectId },
        data: {
          ...(name        ? { name }               : {}),
          ...(code        ? { code }               : {}),
          ...(className   ? { classId: targetClassId } : {}),
        },
        select: {
          id:    true,
          name:  true,
          code:  true,
          class: { select: { name: true, level: true } },
        },
      });

      return NextResponse.json({ message: "Subject updated.", data: updated });
    } 
    catch (error) {
      console.error("[subjectService.update]", error);
      return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
  },
};