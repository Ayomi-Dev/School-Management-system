'use client';

import { ScoreEntryGrid } from '@/app/(protected)/dashboard/teacher/components/ScoreEntryGrid';
import { useMyClass } from '@/src/hooks/queries/useUsers';
import { useParams } from 'next/navigation';

export default function CAScoresPage() {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();

  return <ScoreEntryGrid classId={classId} subjectId={subjectId} field="caScore" label="CA" />;
}
