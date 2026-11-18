import { requireRoleForTenant } from '@/src/lib/tenant';
import { announcementService } from '@/src/services/announcement/announcement.service';
import { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  const auth = await requireRoleForTenant(req, [Role.ADMIN]);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { schoolId } = auth
  const announcements = await announcementService.listForAdmin(schoolId as string);
  return announcements
};

export const POST = async (req: NextRequest) => {
  const auth = await requireRoleForTenant(req, [Role.ADMIN]);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { schoolId, userId } = auth
  const announcementData = await announcementService.create(req, schoolId as string, userId);
  return announcementData;
};
