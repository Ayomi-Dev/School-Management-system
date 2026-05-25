import { prisma } from "@/src/lib/prisma/client";

// ============================================================
// SERVER-SIDE ENTITY RESOLVER
//
// All DB IDs are resolved from human-readable identifiers.
// Callers receive typed result objects; errors are thrown as
// ResolverError so the service layer can return 404/400 cleanly.
// ============================================================

export class ResolverError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: 400 | 404 | 409 = 404
  ) {
    super(message);
    this.name = "ResolverError";
  }
}

// ─────────────────────────────────────────────────────────────
// ACADEMIC YEAR
// ─────────────────────────────────────────────────────────────

export async function resolveAcademicYear(
  schoolId: string,
  label?: string // if undefined → fall back to isCurrent=true
) {
  const where = label
    ? { schoolId, label }
    : { schoolId, isCurrent: true };

  const year = await prisma.academicYear.findFirst({
    where,
    select: { id: true, label: true, isCurrent: true },
  });

  if (!year) {
    const msg = label
      ? `Academic year "${label}" not found for this school.`
      : "No active academic year found. Set one as current or pass an academicYearLabel.";
    throw new ResolverError(msg);
  }

  return year;
}

// ─────────────────────────────────────────────────────────────
// TERM
// ─────────────────────────────────────────────────────────────

export async function resolveTerm(
  schoolId: string,
  options: { period?: "FIRST" | "SECOND" | "THIRD"; academicYearId?: string } = {}
) {
  const { period, academicYearId } = options;

  // Build the where clause — always scope to this school via academicYear
  const where: any = {
    academicYear: { schoolId },
  };

  if (academicYearId) where.academicYearId = academicYearId;
  if (period) where.period = period;

  // If neither specified → active term
  if (!period && !academicYearId) where.isCurrent = true;

  const term = await prisma.term.findFirst({
    where,
    select: { id: true, period: true, isCurrent: true, academicYearId: true },
    // If there are multiple matches (e.g. only academicYearId given), take current or first
    orderBy: [{ isCurrent: "desc" }, { startDate: "asc" }],
  });

  if (!term) {
    const hint = period ? `"${period}"` : "active";
    throw new ResolverError(`No ${hint} term found for this school.`);
  }

  return term;
}

// ─────────────────────────────────────────────────────────────
// CLASS
// ─────────────────────────────────────────────────────────────

export async function resolveClass(
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  schoolId: string,
  className: string
) {
  const classRecord = await prisma.class.findFirst({
    where: { schoolId, name: className },
    select: { id: true, name: true, level: true, department: true },
  });
  return classRecord;
}

// ─────────────────────────────────────────────────────────────
// CLASS BY LEVEL (when no specific name is given — picks first
// class at that level within the school)
// ─────────────────────────────────────────────────────────────

export async function resolveClassByLevel(
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  schoolId: string,
  level: string,
  className?: string // if provided, validates level matches
) {
  if (className) {
    const cls = await resolveClass(tx, schoolId, className);
    
    return cls;
  }

  // Fall back: first class at this level (ordered by class.order)
  const cls = await prisma.class.findFirst({
    where: { schoolId,  },
    orderBy: { order: "asc" },
    select: { id: true, name: true, level: true, department: true },
  });

  if (!cls) {
    throw new ResolverError(
      `No class found for level "${level}" in this school. Create one first.`,
      404
    );
  }

  return cls;
}

// ─────────────────────────────────────────────────────────────
// SUBJECT
// ─────────────────────────────────────────────────────────────

export async function resolveSubject(schoolId: string, subjectName: string) {
  const subject = await prisma.subject.findFirst({
    where: { schoolId, name: subjectName },
    select: { id: true, name: true, code: true, teacherId: true },
  });

  if (!subject) {
    throw new ResolverError(
      `Subject "${subjectName}" not found in this school.`
    );
  }

  return subject;
}

// ─────────────────────────────────────────────────────────────
// TEACHER (by employee number)
// ─────────────────────────────────────────────────────────────

export async function resolveTeacher(schoolId: string, employeeNumber: string) {
  const teacher = await prisma.teacherProfile.findFirst({
    where: { schoolId, employeeNumber, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, employeeNumber: true },
  });

  if (!teacher) {
    throw new ResolverError(
      `Teacher with employee number "${employeeNumber}" not found.`
    );
  }

  return teacher;
}

// ─────────────────────────────────────────────────────────────
// STUDENT PROFILE (by student number)
// ─────────────────────────────────────────────────────────────

export async function resolveStudent(schoolId: string, studentNumber: string) {
  const student = await prisma.studentProfile.findFirst({
    where: { schoolId, studentNumber },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      studentNumber: true,
      status: true,
    },
  });

  if (!student) {
    throw new ResolverError(
      `Student "${studentNumber}" not found in this school.`
    );
  }

  return student;
}

// ─────────────────────────────────────────────────────────────
// BATCH STUDENT RESOLVER  (studentNumbers[] → StudentProfile[])
// Returns { resolved[], missing[] } so callers can decide
// whether a partial match is acceptable.
// ─────────────────────────────────────────────────────────────

export async function resolveStudentsBatch(
  schoolId: string,
  studentNumbers: string[]
) {
  const profiles = await prisma.studentProfile.findMany({
    where: { schoolId, studentNumber: { in: studentNumbers } },
    select: { id: true, studentNumber: true, firstName: true, lastName: true },
  });

  const foundNumbers = new Set(profiles.map((p) => p.studentNumber));
  const missing = studentNumbers.filter((n) => !foundNumbers.has(n));

  return { resolved: profiles, missing };
}

// ─────────────────────────────────────────────────────────────
// CLASS SESSION (by ID — already a DB id from a prior list call)
// ─────────────────────────────────────────────────────────────

export async function resolveClassSession(sessionId: string, schoolId: string) {
  const session = await prisma.classSession.findFirst({
    where: {
      id: sessionId,
      class: { schoolId },
    },
    select: {
      id: true,
      classId: true,
      termId: true,
      date: true,
      isCompleted: true,
    },
  });

  if (!session) {
    throw new ResolverError(`Class session not found.`);
  }

  return session;
}

// ─────────────────────────────────────────────────────────────
// CONVENIENCE: resolve term from period string (route param)
// ─────────────────────────────────────────────────────────────

export async function resolveTermByPeriod(
  schoolId: string,
  period: "FIRST" | "SECOND" | "THIRD",
  academicYearLabel?: string
) {
  const year = await resolveAcademicYear( schoolId, academicYearLabel);
  return resolveTerm(schoolId, { period, academicYearId: year.id });
}

// ─────────────────────────────────────────────────────────────
// ACTIVE CONTEXT helper — returns current academic year + term
// for the school, used as a default when no override is given.
// ─────────────────────────────────────────────────────────────

export async function resolveActiveContext(schoolId: string) {
  const year = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
    select: { id: true, label: true },
  });

  if (!year) {
    throw new ResolverError(
      "No active academic year. Set one as current before performing this action."
    );
  }

  const term = await prisma.term.findFirst({
    where: { academicYearId: year.id, isCurrent: true },
    select: { id: true, period: true },
  });

  if (!term) {
    throw new ResolverError(
      "No active term. Set a term as current before performing this action."
    );
  }

  return { year, term };
}