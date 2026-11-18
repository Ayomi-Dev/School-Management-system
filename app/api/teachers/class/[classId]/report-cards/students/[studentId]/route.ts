import { requireRoleForTenant } from '@/src/lib/tenant';
import { reportCardServices } from '@/src/services/reportCard/reportCard.service';
import { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ classId: string; studentId: string }> },
) {
  const auth = await requireRoleForTenant(req, [Role.TEACHER]);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { classId, studentId } = await context.params;
  return reportCardServices.getStudentReportSheet(auth.userId, classId, studentId);
}
