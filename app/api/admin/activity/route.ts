import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { requireRoleForTenant } from '@/src/lib/tenant';
import { prisma } from '@/src/lib/prisma/client';

export async function GET(request: NextRequest) {
  const auth = await requireRoleForTenant(request, [Role.ADMIN]);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!auth.schoolId) {
    return NextResponse.json({ error: 'School association required.' }, { status: 403 });
  }

  try {
    const activity = await prisma.auditLog.findMany({
      where: { schoolId: auth.schoolId, userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { id: true, action: true, resource: true, resourceId: true, createdAt: true, metadata: true },
    });
    return NextResponse.json({ data: activity });
  } catch (error) {
    console.error('[admin recent activity]', error);
    return NextResponse.json({ error: 'Could not load recent activity.' }, { status: 500 });
  }
}
