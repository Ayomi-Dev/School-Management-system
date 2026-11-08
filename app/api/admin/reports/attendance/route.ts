import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { requireRoleForTenant } from '@/src/lib/tenant';
import { attendanceServices } from '@/src/services/attendance/attendance.service';

export async function GET(request: NextRequest) {
  const auth = await requireRoleForTenant(request, [Role.ADMIN]);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!auth.schoolId) {
    return NextResponse.json({ error: 'School association required.' }, { status: 403 });
  }

  const fromValue = request.nextUrl.searchParams.get('from');
  const toValue = request.nextUrl.searchParams.get('to');
  const from = fromValue ? new Date(`${fromValue}T00:00:00.000Z`) : undefined;
  const to = toValue ? new Date(`${toValue}T23:59:59.999Z`) : undefined;
  if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
    return NextResponse.json({ error: 'Enter valid start and end dates.' }, { status: 400 });
  }
  if (from && to && from > to) {
    return NextResponse.json({ error: 'Start date must be before end date.' }, { status: 400 });
  }

  try {
    const report = await attendanceServices.getSchoolAttendanceReport(auth.schoolId, from, to);
    return NextResponse.json({ data: report });
  } catch (error) {
    console.error('[admin attendance report]', error);
    return NextResponse.json({ error: 'Could not load attendance reports.' }, { status: 500 });
  }
}
