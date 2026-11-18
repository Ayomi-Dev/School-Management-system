import { useQuery } from '@tanstack/react-query';
import { timetableService } from '@/src/services/client/timetable';

export const useMyTimetable = (studentId?: string) => useQuery({
  queryKey: ['my-timetable', studentId ?? 'self'],
  queryFn: () => timetableService.getMyTimetable(studentId),
  staleTime: 30_000,
});
