import { prisma } from "@/src/lib/prisma/client";
import { AcademicReportResponse, AcademicReportStudentRow } from "@/src/types/academicReport";

const DEFAULT_PASS_THRESHOLD = 45;

interface AcademicReportFilters {
  academicYearId?: string | null;
  termId?: string | null;
  classId?: string | null;
}

export const academicReportService = {
  async getAcademicPerformance(
    schoolId: string,
    filters: AcademicReportFilters,
  ): Promise<AcademicReportResponse> {
    const passBand = await prisma.gradeScale.findFirst({
      where: { schoolId, remark: "Pass" },
      orderBy: { minScore: "asc" },
      select: { minScore: true },
    });
    const passThreshold = passBand?.minScore ?? DEFAULT_PASS_THRESHOLD;

    const academicYears = await prisma.academicYear.findMany({
      where: { schoolId },
      orderBy: [{ startDate: "desc" }, { label: "desc" }],
      select: {
        id: true,
        label: true,
        isCurrent: true,
        startDate: true,
        endDate: true,
        terms: {
          orderBy: { startDate: "asc" },
          select: { id: true, period: true, isCurrent: true, startDate: true, endDate: true },
        },
      },
    });

    const requestedYear = filters.academicYearId
      ? academicYears.find((year) => year.id === filters.academicYearId) ?? null
      : null;
    if (filters.academicYearId && !requestedYear) {
      throw Object.assign(new Error("Academic year not found for this school."), { status: 404 });
    }
    const selectedYear =
      requestedYear ??
      academicYears.find((year) => year.isCurrent) ??
      academicYears[0] ??
      null;

    const classes = await prisma.class.findMany({
      where: { schoolId },
      orderBy: [{ order: "asc" }, { level: "asc" }],
      select: { id: true, level: true },
    });

    const selectedClass = filters.classId
      ? classes.find((classItem) => classItem.id === filters.classId) ?? null
      : null;
    if (filters.classId && !selectedClass) {
      throw Object.assign(new Error("Class not found for this school."), { status: 404 });
    }

    if (!selectedYear) {
      return {
        academicYears: [], classes, selectedAcademicYearId: null, selectedTermId: null,
        selectedClassId: null, selectedTermLabel: "No academic year", passThreshold,
        summary: { totalStudents: 0, assessedStudents: 0, averageScore: null, passRate: null },
        classPerformance: [], studentPerformance: [],
      };
    }

    const selectedTerm = filters.termId === "all"
      ? null
      : selectedYear.terms.find((term) => term.id === filters.termId) ??
        selectedYear.terms.find((term) => term.isCurrent) ??
        selectedYear.terms[0] ??
        null;
    if (filters.termId && filters.termId !== "all" && !selectedYear.terms.some((term) => term.id === filters.termId)) {
      throw Object.assign(new Error("Term does not belong to the selected academic year."), { status: 400 });
    }

    const terms = filters.termId === "all"
      ? selectedYear.terms
      : selectedTerm ? [selectedTerm] : [];
    const termIds = terms.map((term) => term.id);
    const selectedClassId = selectedClass?.id ?? null;

    const enrollments = await prisma.enrollment.findMany({
      where: {
        academicYearId: selectedYear.id,
        class: { schoolId, ...(selectedClassId ? { id: selectedClassId } : {}) },
        student: { schoolId, deletedAt: null },
      },
      select: {
        studentId: true,
        classId: true,
        class: { select: { level: true } },
      },
    });
    const enrollmentByStudent = new Map(enrollments.map((enrollment) => [enrollment.studentId, enrollment]));

    const scores = termIds.length === 0 ? [] : await prisma.score.findMany({
      where: {
        termId: { in: termIds },
        isPublished: true,
        totalScore: { not: null },
        subject: {
          schoolId,
          ...(selectedClassId ? { classId: selectedClassId } : {}),
        },
        student: {
          schoolId,
          deletedAt: null,
          enrollments: {
            some: {
              academicYearId: selectedYear.id,
              ...(selectedClassId ? { classId: selectedClassId } : {}),
            },
          },
        },
      },
      select: {
        termId: true,
        totalScore: true,
        student: {
          select: { id: true, firstName: true, lastName: true, studentNumber: true },
        },
        subject: { select: { id: true } },
      },
    });

    const studentTotals = new Map<string, {
      student: (typeof scores)[number]["student"];
      total: number;
      count: number;
      subjectTerms: Set<string>;
    }>();
    for (const score of scores) {
      if (score.totalScore === null) continue;
      const current = studentTotals.get(score.student.id) ?? {
        student: score.student, total: 0, count: 0, subjectTerms: new Set<string>(),
      };
      current.total += score.totalScore;
      current.count += 1;
      current.subjectTerms.add(`${score.subject.id}:${score.termId}`);
      studentTotals.set(score.student.id, current);
    }

    const studentPerformance: AcademicReportStudentRow[] = [...studentTotals.entries()]
      .flatMap(([studentId, result]) => {
        const enrollment = enrollmentByStudent.get(studentId);
        if (!enrollment || result.count === 0) return [];
        return [{
          id: studentId,
          studentName: `${result.student.firstName} ${result.student.lastName}`.trim(),
          studentNumber: result.student.studentNumber,
          classId: enrollment.classId,
          className: enrollment.class.level,
          averageScore: Math.round((result.total / result.count) * 10) / 10,
          subjectsAttempted: result.subjectTerms.size,
        }];
      })
      .sort((a, b) => b.averageScore - a.averageScore || a.studentName.localeCompare(b.studentName));

    const classPerformance = (selectedClass ? [selectedClass] : classes).map((classItem) => {
      const classEnrollments = enrollments.filter((enrollment) => enrollment.classId === classItem.id);
      const assessedStudents = studentPerformance.filter((student) => student.classId === classItem.id);
      const averageScore = assessedStudents.length
        ? Math.round(assessedStudents.reduce((sum, student) => sum + student.averageScore, 0) / assessedStudents.length * 10) / 10
        : null;
      const passCount = assessedStudents.filter((student) => student.averageScore >= passThreshold).length;
      return {
        id: classItem.id,
        className: classItem.level,
        totalStudents: classEnrollments.length,
        assessedStudents: assessedStudents.length,
        averageScore,
        passRate: assessedStudents.length ? Math.round((passCount / assessedStudents.length) * 100) : null,
      };
    });

    const enrolledStudentIds = new Set(enrollments.map((enrollment) => enrollment.studentId));
    const totalStudents = enrolledStudentIds.size;
    const assessedStudents = studentPerformance.length;
    const averageScore = assessedStudents
      ? Math.round(studentPerformance.reduce((sum, student) => sum + student.averageScore, 0) / assessedStudents * 10) / 10
      : null;
    const passCount = studentPerformance.filter((student) => student.averageScore >= passThreshold).length;

    return {
      academicYears: academicYears.map((year) => ({
        id: year.id,
        label: year.label,
        isCurrent: year.isCurrent,
        terms: year.terms.map((term) => ({
          id: term.id,
          period: term.period,
          isCurrent: term.isCurrent,
          startDate: term.startDate.toISOString(),
          endDate: term.endDate.toISOString(),
        })),
      })),
      classes: classes.map((classItem) => ({ id: classItem.id, level: classItem.level })),
      selectedAcademicYearId: selectedYear.id,
      selectedTermId: filters.termId === "all" ? "all" : selectedTerm?.id ?? null,
      selectedClassId,
      selectedTermLabel: filters.termId === "all" ? "All terms" : selectedTerm?.period ?? "No term",
      passThreshold,
      summary: {
        totalStudents,
        assessedStudents,
        averageScore,
        passRate: assessedStudents ? Math.round((passCount / assessedStudents) * 100) : null,
      },
      classPerformance,
      studentPerformance,
    };
  },
};
