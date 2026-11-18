import { requireRoleForTenant } from '@/src/lib/tenant';
import { announcementService } from '@/src/services/announcement/announcement.service';
import { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  const auth = await requireRoleForTenant(req, [Role.STUDENT, Role.TEACHER]);
  if (!auth.success) return NextResponse.json(
    { error: auth.error }, 
    { status: auth.status }
  );
  const { schoolId, role } = auth
  const announcements = await announcementService.listForDashboard(schoolId as string, role);
  return announcements;
};
