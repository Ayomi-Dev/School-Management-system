import z from "zod";

const DAY = z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
const TIME = z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format');
 
export const createSlotSchema = z.object({
  dayOfWeek: DAY,
  startTime: TIME,
  endTime:   TIME,
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),  // TeacherProfile.id
  room:      z.string().trim().max(20).optional(),
}).refine(
  (d) => d.startTime < d.endTime,
  { message: 'End time must be after start time', path: ['endTime'] },
);
 
export const updateSlotSchema = z.object({
  startTime: TIME.optional(),
  endTime:   TIME.optional(),
  subjectId: z.string().min(1).optional(),
  teacherId: z.string().min(1).optional(),
  room:      z.string().trim().max(20).nullable().optional(),
}).refine(
  (d) => {
    if (d.startTime && d.endTime) return d.startTime < d.endTime;
    return true;
  },
  { message: 'End time must be after start time', path: ['endTime'] },
)