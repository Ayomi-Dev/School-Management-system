'use client';

import { ScoreEntryGrid } from '@/app/(protected)/dashboard/teacher/components/ScoreEntryGrid';
import { useParams } from 'next/navigation';

export default function ExamScoresPage() {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();

  return <ScoreEntryGrid classId={classId} subjectId={subjectId} field="examScore" label="Exam" />;
}
