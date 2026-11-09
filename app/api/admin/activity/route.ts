import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { requireRoleForTenant } from '@/src/lib/tenant';
import { prisma } from '@/src/lib/prisma/client';

function readableAction(action: string) {
  const legacy = action.match(/^(POST|PUT|PATCH|DELETE) (\/.*)$/);
  if (!legacy) return action;

  const [, method, pathname] = legacy;
  if (pathname.endsWith('/admin/create-user')) return 'Added a new user';
  if (pathname.endsWith('/publish-report-cards') || pathname.endsWith('/publish')) return 'Published report cards';
  if (pathname.endsWith('/admin/enrollments')) return 'Promoted students to a new class';
  if (method === 'POST' && pathname === '/api/classes') return 'Created a new class';
  if (pathname.endsWith('/admin/subjects/create')) return 'Added a subject';
  if (pathname.endsWith('/admin/teachers/assign-class')) return 'Assigned a teacher to a class';
  const verb = method === 'POST' ? 'Created' : method === 'DELETE' ? 'Removed' : 'Updated';
  const resource = pathname.replace(/^\/api\//, '').replace(/\/[a-f\d]{24}(?=\/|$)/gi, '').split('/').filter((part) => part && part !== 'admin').map((part) => part.replace(/[-_]/g, ' ')).join(' ');
  return `${verb} ${resource || 'school information'}`;
}

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
    return NextResponse.json({ data: activity.map((item) => ({ ...item, action: readableAction(item.action) })) });
  } catch (error) {
    console.error('[admin recent activity]', error);
    return NextResponse.json({ error: 'Could not load recent activity.' }, { status: 500 });
  }
}
