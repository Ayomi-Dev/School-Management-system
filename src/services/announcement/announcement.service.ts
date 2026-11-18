import { AnnouncementTarget, Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma/client';
import { createAnnouncementSchema } from '@/src/validators/announcementSchema';

const ANNOUNCEMENT_SELECT = {
  id: true,
  title: true,
  body: true,
  publishedAt: true,
  createdAt: true,
  author: { select: { firstName: true, lastName: true } },
} as const;

export const announcementService = {
  async listForAdmin(schoolId: string) {
    const announcements = await prisma.announcement.findMany({
      where: { schoolId, target: AnnouncementTarget.SCHOOL },
      select: ANNOUNCEMENT_SELECT,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ data: announcements });
  },

  async create(req: NextRequest, schoolId: string, authorId: string) {
    try {
      const parsed = createAnnouncementSchema.safeParse(await req.json());
      if (!parsed.success) {
        return NextResponse.json({ error: 'Validation failed.', details: parsed.error.flatten().fieldErrors }, { status: 400 });
      }
      const announcement = await prisma.announcement.create({
        data: {
          schoolId,
          authorId,
          title: parsed.data.title,
          body: parsed.data.body,
          target: AnnouncementTarget.SCHOOL,
          publishedAt: new Date(),
        },
        select: ANNOUNCEMENT_SELECT,
      });
      return NextResponse.json({ message: 'Announcement published to students and teachers.', data: announcement }, { status: 201 });
    } catch (error) {
      console.error('[announcementService.create]', error);
      return NextResponse.json({ error: 'Could not publish announcement.' }, { status: 500 });
    }
  },

  async listForDashboard(schoolId: string, role: Role) {
    if (role !== Role.STUDENT && role !== Role.TEACHER) {
      return NextResponse.json({ error: 'Announcements are not available for this role.' }, { status: 403 });
    }
    const now = new Date();
    const announcements = await prisma.announcement.findMany({
      where: {
        schoolId,
        target: AnnouncementTarget.SCHOOL,
        publishedAt: { not: null },
      },
      select: { ...ANNOUNCEMENT_SELECT, scheduledAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 100,
    });
    const visible = announcements
      .filter(({ scheduledAt }) => !scheduledAt || scheduledAt <= now)
      .slice(0, 10)
      .map(({ scheduledAt: _scheduledAt, ...announcement }) => announcement);
    return NextResponse.json({ data: visible });
  },
};
