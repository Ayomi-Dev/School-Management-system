import { useQuery } from '@tanstack/react-query';
import { parentService } from '@/src/services/client/parent';

// ─── Query keys ────────────────────────────────────────────────────────────────

export const parentKeys = {
  linkedStudents:  ()                              => ['parent-linked-students'] as const,
  studentSummary:  (studentId: string, termId?: string) =>
                     ['parent-student-summary', studentId, termId ?? 'all'] as const,
  reportCard:      (reportCardId: string)          => ['parent-report-card', reportCardId] as const,
} as const;

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches all students linked to the logged-in parent, with snapshot numbers.
 * Always enabled — this is the root data for the whole parent dashboard.
 */
export const useLinkedStudents = () =>
  useQuery({
    queryKey: parentKeys.linkedStudents(),
    queryFn:  () => parentService.getLinkedStudents(),
  });

/**
 * Fetches full academic detail for one linked student.
 * `enabled` lets the page gate the fetch behind a tab click or explicit action.
 * `termId` scopes scores + report cards to a specific term when provided.
 */
export const useStudentSummary = (
  studentId: string,
  enabled:   boolean = true,
  termId?:   string
) =>
  useQuery({
    queryKey: parentKeys.studentSummary(studentId, termId),
    queryFn:  () => parentService.getStudentSummary(studentId, termId),
    enabled:  enabled && !!studentId,
  });

/**
 * Fetches a single published report card with scores and attendance.
 * Only fires when reportCardId is present and `enabled` is true.
 */
export const useStudentReportCard = (
  reportCardId: string,
  enabled:      boolean = true,
) =>
  useQuery({
    queryKey: parentKeys.reportCard(reportCardId),
    queryFn:  () => parentService.getStudentReportCard(reportCardId),
    enabled:  enabled && !!reportCardId,
  });