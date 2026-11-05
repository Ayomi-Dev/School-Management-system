import { renderToBuffer } from "@react-pdf/renderer";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { createReportCardPdfDocument } from "@/src/components/pdf/ReportCardPdf";
import {
  ReportCardDownloadError,
  reportCardDownloadService,
} from "@/src/services/reportCard/reportCardDownload.service";

export const runtime = "nodejs";

const allowedRoles = [Role.STUDENT, Role.PARENT, Role.ADMIN, Role.TEACHER];

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ reportCardId: string }> },
) {
  const auth = await requireRoleForTenant(req, allowedRoles);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!auth.schoolId) {
    return NextResponse.json({ error: "School association required." }, { status: 403 });
  }

  try {
    const { reportCardId } = await context.params;
    const data = await reportCardDownloadService.getDocumentData(reportCardId, {
      userId: auth.userId,
      schoolId: auth.schoolId,
      role: auth.role,
    });
    const pdf = await renderToBuffer(createReportCardPdfDocument(data));
    const filename = `${data.student.studentNumber}-${data.reportCard.academicYear}-${data.reportCard.term}-report-card.pdf`
      .replace(/[^a-zA-Z0-9._-]/g, "-");

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof ReportCardDownloadError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[GET /api/report-cards/:reportCardId/download]", error);
    return NextResponse.json({ error: "Unable to generate report card PDF." }, { status: 500 });
  }
}
