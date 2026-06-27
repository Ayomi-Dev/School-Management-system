import { studentService } from "@/src/services/client/student";
import { teacherService } from "@/src/services/client/teacher";
import { StudentAcademicSummaryResponse, UseStudentAcademicSummaryParams } from "@/src/types/api";
import { AttendanceHistoryParams, MarkAttendancePayload } from "@/app/(protected)/dashboard/teacher/components/teacher";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const attendanceKeys = {
  all: ['attendance'] as const,
  roster: (classId: string, date?: string) =>
    [...attendanceKeys.all, 'roster', classId, date ?? 'today'] as const,
  history: (classId: string, params?: Omit<AttendanceHistoryParams, 'classId'>) =>
    [...attendanceKeys.all, 'history', classId, params] as const,
};

export const useDailyRoster = (classId: string, date?: string) => {
  return useQuery({
    queryKey: attendanceKeys.roster(classId, date),
    queryFn: () => teacherService.getDailyRoster(classId, date),
    enabled: !!classId,
    staleTime: 30 * 1000, // short — attendance is actively being edited
  });
};

/**
 * Bulk-saves marked attendance for a session. On success, invalidates both
 * the roster (so isCompleted/status reflect the save) and history (so the
 * new/updated day shows up in past records) for this class.
 */
export const useMarkAttendance = (classId: string) => {
  const queryClient = useQueryClient();
 
  return useMutation({
    mutationFn: (payload: MarkAttendancePayload) =>
      teacherService.markAttendance(classId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.roster(classId) });
      queryClient.invalidateQueries({
        queryKey: [...attendanceKeys.all, 'history', classId],
      });
    },
  });
};

export const useAttendanceHistory = (params: AttendanceHistoryParams) => {
  return useQuery({
    queryKey: attendanceKeys.history(params.classId, params),
    queryFn: () => teacherService.getAttendanceHistory(params),
    enabled: !!params.classId,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
};