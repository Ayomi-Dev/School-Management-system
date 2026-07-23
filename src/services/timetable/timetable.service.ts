import { prisma } from "@/src/lib/prisma/client";
import { SLOT_SELECT } from "@/src/lib/prisma/fields";
import { resolveAdminSchool } from "@/src/utils/resolvers";
import { createSlotSchema, updateSlotSchema } from "@/src/validators/timetable";
import { NextRequest, NextResponse } from "next/server";

 
export const timetableService = {
 
  // ───────────────────────────────────────────────────────────────────────────
  // GET /admin/classes/:classId/timetable
  //
  // Returns all timetable slots for the class, ordered day → start time.
  // School ownership is verified so an admin can't query another school's class.
  // ───────────────────────────────────────────────────────────────────────────
  async getClassTimetable(adminId: string, classId: string) {
    try {
      const schoolId = await resolveAdminSchool(adminId);
      if (!schoolId) {
        return NextResponse.json({ error: 'Admin profile not found.' }, { status: 404 });
      }
 
      const classRecord = await prisma.class.findFirst({
        where:  { id: classId, schoolId },
        select: { id: true, level: true },
      });
      if (!classRecord) {
        return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
      }
 
      const DAY_ORDER: Record<string, number> = {
        MONDAY: 0, TUESDAY: 1, WEDNESDAY: 2, THURSDAY: 3, FRIDAY: 4,
      };
 
      const slots = await prisma.timetableSlot.findMany({
        where:   { classId },
        select:  SLOT_SELECT,
        // orderBy across two fields: day order first, then time within day
        // Single-field orderBy is safe on MongoDB; chaining two is not always
        // supported across relation boundaries so we sort in app code below.
      });
 
      // Sort: day order → startTime lexicographically ("08:00" < "09:00" etc.)
      slots.sort((a, b) => {
        const dayDiff = DAY_ORDER[a.dayOfWeek] - DAY_ORDER[b.dayOfWeek];
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
      });
 
      return NextResponse.json({
        data: {
          classId:    classRecord.id,
          classLevel: classRecord.level,
          slots,
        },
      });
    } catch (error) {
      console.error('[timetableService.getClassTimetable]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
 
  // ───────────────────────────────────────────────────────────────────────────
  // GET /admin/classes/:classId/timetable/teachers
  //
  // Returns all teachers who teach at least one subject in this class.
  // Used to populate the teacher dropdown in the create/edit modal —
  // the admin should only be able to assign teachers who are actually
  // responsible for a subject in the class.
  // ───────────────────────────────────────────────────────────────────────────
  async getClassTeachers(adminId: string, classId: string) {
    try {
      const schoolId = await resolveAdminSchool(adminId);
      if (!schoolId) {
        return NextResponse.json({ error: 'Admin profile not found.' }, { status: 404 });
      }
 
      const classRecord = await prisma.class.findFirst({
        where:  { id: classId, schoolId },
        select: { id: true },
      });
      if (!classRecord) {
        return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
      }
 
      // Pull subject-teacher assignments for subjects belonging to this class
      const assignments = await prisma.subjectTeacher.findMany({
        where:  { subject: { classId } },
        select: {
          subject: { select: { id: true, name: true } },
          teacher: {
            select: {
              id:   true,
              user: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      });
 
      // Group by teacher, collecting all their subjects in this class
      const map = new Map<string, {
        teacherProfileId: string;
        userId:           string;
        firstName:        string;
        lastName:         string;
        subjects:         Array<{ id: string; name: string }>;
      }>();
 
      for (const a of assignments) {
        const key = a.teacher.id;
        if (!map.has(key)) {
          map.set(key, {
            teacherProfileId: a.teacher.id,
            userId:           a.teacher.user?.id,
            firstName:        a.teacher.user?.firstName ?? '',
            lastName:         a.teacher.user?.lastName ?? '',
            subjects:         [],
          });
        }
        map.get(key)!.subjects.push({ id: a.subject.id, name: a.subject.name });
      }
 
      return NextResponse.json({ data: Array.from(map.values()) });
    } catch (error) {
      console.error('[timetableService.getClassTeachers]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
 
  // ───────────────────────────────────────────────────────────────────────────
  // POST /admin/classes/:classId/timetable
  //
  // Creates a new timetable slot.
  // Conflict detection:
  //   1. Class already has a slot starting at this time on this day.
  //   2. Teacher is already booked at this time on this day (in any class).
  //   3. End time ≤ start time.
  //
  // Subject and teacher are verified to belong to the same school before insert.
  // ───────────────────────────────────────────────────────────────────────────
  async createTimetableSlot(req: NextRequest, adminId: string, classId: string) {
    try {
      const schoolId = await resolveAdminSchool(adminId);
      if (!schoolId) {
        return NextResponse.json({ error: 'Admin profile not found.' }, { status: 404 });
      }
 
      const classRecord = await prisma.class.findFirst({
        where:  { id: classId, schoolId },
        select: { id: true },
      });
      if (!classRecord) {
        return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
      }
 
      const body   = await req.json();
      const parsed = createSlotSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }
      const { dayOfWeek, startTime, endTime, subjectId, teacherId, room } = parsed.data;
 
      // ── Verify subject belongs to this class ──────────────────────────────
      const subject = await prisma.subject.findFirst({
        where:  { id: subjectId, classId },
        select: { id: true },
      });
      if (!subject) {
        return NextResponse.json(
          { error: 'Subject does not belong to this class.' },
          { status: 400 },
        );
      }
 
      // ── Verify teacher belongs to this school ─────────────────────────────
      const teacher = await prisma.teacherProfile.findFirst({
        where:  { id: teacherId, schoolId },
        select: { id: true },
      });
      if (!teacher) {
        return NextResponse.json(
          { error: 'Teacher not found in this school.' },
          { status: 400 },
        );
      }
 
      // ── Class conflict: same day + overlapping time ────────────────────────
      // A new slot [startTime, endTime) conflicts with an existing slot
      // [s.startTime, s.endTime) when: s.startTime < endTime && s.endTime > startTime
      const classConflict = await prisma.timetableSlot.findFirst({
        where: {
          classId,
          dayOfWeek,
          startTime: { lt: endTime },
          endTime:   { gt: startTime },
        },
        select: { startTime: true, endTime: true },
      });
      if (classConflict) {
        return NextResponse.json(
          {
            error: `Class already has a slot from ${classConflict.startTime}–${classConflict.endTime} on that day.`,
          },
          { status: 409 },
        );
      }
 
      // ── Teacher conflict: same teacher double-booked ───────────────────────
      const teacherConflict = await prisma.timetableSlot.findFirst({
        where: {
          teacherId,
          dayOfWeek,
          startTime: { lt: endTime },
          endTime:   { gt: startTime },
        },
        select: { startTime: true, endTime: true, class: { select: { level: true } } },
      });
      if (teacherConflict) {
        return NextResponse.json(
          {
            error: `Teacher is already scheduled from ${teacherConflict.startTime}–${teacherConflict.endTime} for ${teacherConflict.class.level} on that day.`,
          },
          { status: 409 },
        );
      }
 
      const slot = await prisma.timetableSlot.create({
        data: {
          classId,
          subjectId,
          teacherId,
          dayOfWeek,
          startTime,
          endTime,
          room:     room ?? null,
          schoolId,
        },
        select: SLOT_SELECT,
      });
 
      return NextResponse.json(
        { message: 'Timetable slot created.', data: slot },
        { status: 201 },
      );
    } catch (error) {
      console.error('[timetableService.createTimetableSlot]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
 
  // ───────────────────────────────────────────────────────────────────────────
  // PATCH /admin/classes/:classId/timetable/:slotId
  //
  // Updates an existing slot. Re-runs conflict detection on changed fields.
  // ───────────────────────────────────────────────────────────────────────────
  async updateTimetableSlot(
    req:    NextRequest,
    adminId: string,
    classId: string,
    slotId:  string,
  ) {
    try {
      const schoolId = await resolveAdminSchool(adminId);
      if (!schoolId) {
        return NextResponse.json({ error: 'Admin profile not found.' }, { status: 404 });
      }
 
      const existing = await prisma.timetableSlot.findFirst({
        where:  { id: slotId, classId, schoolId },
        select: { id: true, dayOfWeek: true, startTime: true, endTime: true, teacherId: true },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Slot not found.' }, { status: 404 });
      }
 
      const body   = await req.json();
      const parsed = updateSlotSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }
 
      const data     = parsed.data;
      const newStart = data.startTime ?? existing.startTime;
      const newEnd   = data.endTime   ?? existing.endTime;
      const newTeacherId = data.teacherId ?? existing.teacherId;
 
      if (newStart >= newEnd) {
        return NextResponse.json(
          { error: 'End time must be after start time.' },
          { status: 400 },
        );
      }
 
      // Re-check class conflict (excluding this slot itself)
      if (data.startTime || data.endTime) {
        const classConflict = await prisma.timetableSlot.findFirst({
          where: {
            classId,
            dayOfWeek: existing.dayOfWeek,
            startTime: { lt: newEnd },
            endTime:   { gt: newStart },
            NOT:       { id: slotId },
          },
          select: { startTime: true, endTime: true },
        });
        if (classConflict) {
          return NextResponse.json(
            { error: `Conflicts with existing slot ${classConflict.startTime}–${classConflict.endTime}.` },
            { status: 409 },
          );
        }
      }
 
      // Re-check teacher conflict
      if (data.teacherId || data.startTime || data.endTime) {
        const teacherConflict = await prisma.timetableSlot.findFirst({
          where: {
            teacherId: newTeacherId,
            dayOfWeek: existing.dayOfWeek,
            startTime: { lt: newEnd },
            endTime:   { gt: newStart },
            NOT:       { id: slotId },
          },
          select: { startTime: true, endTime: true, class: { select: { level: true } } },
        });
        if (teacherConflict) {
          return NextResponse.json(
            {
              error: `Teacher already booked ${teacherConflict.startTime}–${teacherConflict.endTime} for ${teacherConflict.class.level}.`,
            },
            { status: 409 },
          );
        }
      }
 
      // Strip undefined fields
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined),
      );
 
      const updated = await prisma.timetableSlot.update({
        where:  { id: slotId },
        data:   updateData,
        select: SLOT_SELECT,
      });
 
      return NextResponse.json({ message: 'Slot updated.', data: updated });
    } catch (error) {
      console.error('[timetableService.updateTimetableSlot]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
 
  // ───────────────────────────────────────────────────────────────────────────
  // DELETE /admin/classes/:classId/timetable/:slotId
  // ───────────────────────────────────────────────────────────────────────────
  async deleteTimetableSlot(adminId: string, classId: string, slotId: string) {
    try {
      const schoolId = await resolveAdminSchool(adminId);
      if (!schoolId) {
        return NextResponse.json({ error: 'Admin profile not found.' }, { status: 404 });
      }
 
      const slot = await prisma.timetableSlot.findFirst({
        where:  { id: slotId, classId, schoolId },
        select: { id: true },
      });
      if (!slot) {
        return NextResponse.json({ error: 'Slot not found.' }, { status: 404 });
      }
 
      await prisma.timetableSlot.delete({ where: { id: slotId } });
 
      return NextResponse.json({ message: 'Slot deleted.' });
    } catch (error) {
      console.error('[timetableService.deleteTimetableSlot]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
};