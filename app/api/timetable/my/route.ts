import { requireRoleForTenant } from '@/src/lib/tenant';
import { timetableService } from '@/src/services/timetable/timetable.service';
import { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  const auth = await requireRoleForTenant(req, [Role.TEACHER, Role.STUDENT, Role.PARENT]);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const studentId = new URL(req.url).searchParams.get('studentId')?.trim() || undefined;
  return timetableService.getMyTimetable(auth.userId, auth.schoolId, auth.role, studentId);
};
