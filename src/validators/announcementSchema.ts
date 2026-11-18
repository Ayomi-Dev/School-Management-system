import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(160),
  body: z.string().trim().min(1, 'Announcement content is required.').max(12000),
});
