import { NextRequest } from 'next/server';
import { prisma } from '@/src/lib/prisma/client';

const titleCase = (value: string) => value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const isObjectId = (value: string) => /^[a-f\d]{24}$/i.test(value);

export async function describeAdminActivity(request: NextRequest, schoolId: string): Promise<string> {
  const pathname = request.nextUrl.pathname;
  const method = request.method.toUpperCase();
  let body: Record<string, unknown> = {};
  try {
    const parsed = await request.clone().json();
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) body = parsed as Record<string, unknown>;
  } catch {
    // Most actions do not need request data to produce a useful summary.
  }

  if (method === 'POST' && pathname.endsWith('/admin/create-user')) {
    const role = String(body.role ?? '').toUpperCase();
    if (role === 'STUDENT') {
      const level = String(body.level ?? '').toUpperCase();
      return level ? `Added a new student to ${level}` : 'Added a new student';
    }
    const roleLabels: Record<string, string> = { TEACHER: 'teacher', PARENT: 'parent', BURSAR: 'bursar' };
    return `Added a new ${roleLabels[role] ?? 'user'}`;
  }

  if (method === 'POST' && pathname === '/api/classes') {
    const level = String(body.level ?? '').toUpperCase();
    return level ? `Created a new ${level} class` : 'Created a new class';
  }

  if (method === 'POST' && pathname.endsWith('/admin/enrollments')) {
    const sourceClassId = String(body.sourceClassId ?? '');
    const targetClassId = String(body.targetClassId ?? '');
    const studentCount = Array.isArray(body.studentIds) ? body.studentIds.length : 0;
    if (!isObjectId(sourceClassId) || !isObjectId(targetClassId)) {
      return `Promoted ${studentCount} student${studentCount === 1 ? '' : 's'} to a new class`;
    }
    const classes = await prisma.class.findMany({
      where: { id: { in: [sourceClassId, targetClassId].filter(Boolean) }, schoolId },
      select: { id: true, level: true },
    });
    const source = classes.find((item) => item.id === sourceClassId)?.level;
    const target = classes.find((item) => item.id === targetClassId)?.level;
    if (source && target) return `Promoted ${studentCount} student${studentCount === 1 ? '' : 's'} from ${source} to ${target}`;
    return `Promoted ${studentCount} student${studentCount === 1 ? '' : 's'} to a new class`;
  }

  const classPublishMatch = pathname.match(/^\/api\/classes\/([^/]+)\/publish-report-cards$/);
  if (method === 'POST' && classPublishMatch) {
    if (!isObjectId(classPublishMatch[1])) return 'Published class report cards';
    const classRecord = await prisma.class.findFirst({
      where: { id: classPublishMatch[1], schoolId },
      select: { level: true },
    });
    return classRecord ? `Published report cards for ${classRecord.level} class` : 'Published class report cards';
  }

  const singlePublishMatch = pathname.match(/^\/api\/admin\/report-cards\/([^/]+)\/publish$/);
  if (method === 'POST' && singlePublishMatch) {
    if (!isObjectId(singlePublishMatch[1])) return 'Published a student report card';
    const reportCard = await prisma.reportCard.findFirst({
      where: { id: singlePublishMatch[1], student: { schoolId } },
      select: { student: { select: { enrollments: { take: 1, orderBy: { enrolledAt: 'desc' }, select: { class: { select: { level: true } } } } } } },
    });
    const level = reportCard?.student.enrollments[0]?.class.level;
    return level ? `Published a report card for a ${level} student` : 'Published a student report card';
  }

  if (method === 'POST' && pathname.endsWith('/admin/subjects/create')) {
    const subject = String(body.name ?? '').trim();
    return subject ? `Added ${subject} as a subject` : 'Added a subject';
  }

  if (pathname.includes('/admin/teachers/assign-class') && method === 'POST') {
    const classId = String(body.classId ?? '');
    const classRecord = isObjectId(classId) ? await prisma.class.findFirst({ where: { id: classId, schoolId }, select: { level: true } }) : null;
    return classRecord ? `Assigned a teacher to ${classRecord.level}` : 'Assigned a teacher to a class';
  }

  const action = method === 'POST' ? 'Created' : method === 'DELETE' ? 'Removed' : 'Updated';
  const resource = pathname
    .replace(/^\/api\//, '')
    .replace(/\/[a-f\d]{24}(?=\/|$)/gi, '')
    .split('/')
    .filter((part) => part && part !== 'admin')
    .map((part) => titleCase(part.replace(/[-_]/g, ' ')))
    .join(' ');
  return `${action} ${resource || 'school data'}`;
}
