import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { academicReportService } from "@/src/services/academics/academicReport.service";

export const GET = async (req: NextRequest) => {
  const auth = await requireRoleForTenant(req, [Role.ADMIN]);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!auth.schoolId) {
    return NextResponse.json({ error: "School association required." }, { status: 403 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const report = await academicReportService.getAcademicPerformance(auth.schoolId, {
      academicYearId: searchParams.get("academicYearId"),
      termId: searchParams.get("termId"),
      classId: searchParams.get("classId"),
    });
    return NextResponse.json({ data: report });
  } catch (error) {
    const status = typeof error === "object" && error !== null && "status" in error
      ? Number(error.status)
      : 500;
    const message = error instanceof Error ? error.message : "Failed to load academic report.";
    if (status >= 500) console.error("[GET /api/admin/reports/academic]", error);
    return NextResponse.json({ error: message }, { status });
  }
};
