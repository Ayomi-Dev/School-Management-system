import { requireRoleForTenant } from '@/src/lib/tenant';
import { announcementService } from '@/src/services/announcement/announcement.service';
import { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  const auth = await requireRoleForTenant(req, [Role.ADMIN]);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return announcementService.listForAdmin(auth.schoolId);
};

export const POST = async (req: NextRequest) => {
  const auth = await requireRoleForTenant(req, [Role.ADMIN]);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return announcementService.create(req, auth.schoolId, auth.userId);
};
