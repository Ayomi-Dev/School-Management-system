'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/src/components/ui/Card';
import { Loader } from '@/src/components/ui/Loader';
import { BookOpen, ChevronRight, UserCheck } from 'lucide-react';
import { useMySubjectsForClass } from '@/src/hooks/queries/useScores';

/**
 * The missing link between the sidebar nav and the CA/Exam score pages.
 * Those pages read subjectId from the URL (useParams), which is undefined
 * until the teacher actually picks a subject here first. Clicking a card
 * routes into /subjects/[subjectId]/scores/ca with a real subjectId in the
 * path.
 */
export default function MySubjectsPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const { data, isLoading, error } = useMySubjectsForClass(classId);
  const subjects = data?.data ?? [];
  const isClassTeacher = data?.meta.accessLevel === 'class_teacher';

  const goToScores = () => {
    router.push(`/dashboard/teacher/classes/${classId}/subjects/scores/ca`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader />
      </div>
    );
  }
 
  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-red-600 font-medium">Could not load subjects.</p>
          <p className="text-sm text-gray-500 mt-1">
            {(error as any)?.response?.data?.error ?? 'Please try again.'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Subjects</h1>
        <p className="text-gray-600 mt-1">
          {isClassTeacher
            ? 'As class teacher, you can enter scores for any subject in this class.'
            : 'Select a subject to enter or review scores.'}
        </p>
      </div>

      {subjects.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BookOpen className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-gray-600">
              {isClassTeacher
                ? 'No subjects have been created for this class yet.'
                : "You haven't been assigned to teach any subjects in this class."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <button
              key={subject.subjectId}
              onClick={() => goToScores()}
              className="text-left"
            >
              <Card className="hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{subject.name}</h3>
                    {subject.code && (
                      <p className="text-xs text-gray-500 mt-0.5">{subject.code}</p>
                    )}

                    {/* Teacher attribution — only meaningful in class-teacher view,
                        where you might be entering scores for someone else's subject */}
                    {isClassTeacher && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs">
                        {subject.assignedTeacher ? (
                          <>
                            <UserCheck size={13} className="text-gray-400" />
                            <span className="text-gray-500">
                              {subject.isPersonallyAssigned ? 'You' : subject.assignedTeacher}
                            </span>
                          </>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                            No teacher assigned
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-300 shrink-0 mt-1" />
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
