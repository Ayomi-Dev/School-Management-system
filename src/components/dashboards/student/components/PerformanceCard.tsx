'use client';

import { Card } from '@/src/components/ui/Card';
import { Subject } from '@/src/types';

interface PerformanceCardProps {
  subjects: Subject[];
}

// Distinct palette — one colour per subject slot, cycling if more than 8 subjects
const BAR_COLORS = [
  { bg: 'bg-violet-500',  text: 'text-violet-600',  track: 'bg-violet-100' },
  { bg: 'bg-sky-500',     text: 'text-sky-600',     track: 'bg-sky-100'    },
  { bg: 'bg-emerald-500', text: 'text-emerald-600', track: 'bg-emerald-100'},
  { bg: 'bg-amber-500',   text: 'text-amber-600',   track: 'bg-amber-100'  },
  { bg: 'bg-rose-500',    text: 'text-rose-600',    track: 'bg-rose-100'   },
  { bg: 'bg-cyan-500',    text: 'text-cyan-600',    track: 'bg-cyan-100'   },
  { bg: 'bg-fuchsia-500', text: 'text-fuchsia-600', track: 'bg-fuchsia-100'},
  { bg: 'bg-teal-500',    text: 'text-teal-600',    track: 'bg-teal-100'   },
];

interface GradeInfo {
  grade: string;
  label: string;
  color: string;
}

function getGradeInfo(score: number): GradeInfo {
  if (score >= 90) return { grade: 'A1', label: 'Excellent',         color: 'text-emerald-600' };
  if (score >= 80) return { grade: 'B2', label: 'Very Good',         color: 'text-sky-600'     };
  if (score >= 75) return { grade: 'B3', label: 'Good',              color: 'text-blue-600'    };
  if (score >= 70) return { grade: 'C4', label: 'Credit',            color: 'text-violet-600'  };
  if (score >= 65) return { grade: 'C5', label: 'Credit',            color: 'text-violet-500'  };
  if (score >= 60) return { grade: 'C6', label: 'Credit',            color: 'text-amber-600'   };
  if (score >= 55) return { grade: 'D7', label: 'Pass',              color: 'text-orange-500'  };
  if (score >= 50) return { grade: 'E8', label: 'Pass',              color: 'text-orange-600'  };
  return                  { grade: 'F9', label: 'Needs Improvement',  color: 'text-rose-600'    };
}

/** Returns the student's best available score for a subject.
 *  Priority: average of all totalScore entries → 0 if none exist. */
function resolveSubjectScore(subject: Subject): number {
  const scores = subject.scores ?? [];
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, s) => acc + (s.totalScore ?? 0), 0);
  return Math.round(sum / scores.length);
}

export function PerformanceCard({ subjects }: PerformanceCardProps) {
  // Derived data
  const subjectScores = subjects.map((subject) => ({
    subject,
    score: resolveSubjectScore(subject),
  }));

  const averageScore =
    subjectScores.length > 0
      ? Math.round(
          subjectScores.reduce((acc, { score }) => acc + score, 0) /
            subjectScores.length,
        )
      : 0;

  const avgGradeInfo = getGradeInfo(averageScore);

  const isEmpty = subjects.length === 0;

  return (
    <Card className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">
          📊 Performance Overview
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Academic performance across all subjects
        </p>
      </div>

      {/* Average Score Banner */}
      <div className="mb-6 rounded-xl bg-gray-50 border border-gray-100 p-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-0.5">
              Overall Average
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-gray-800 leading-none">
                {averageScore}
                <span className="text-xl font-semibold text-gray-400">%</span>
              </span>
              <span
                className={`text-sm font-bold px-2 py-0.5 rounded-full bg-white border ${avgGradeInfo.color} border-current`}
              >
                {avgGradeInfo.grade}
              </span>
            </div>
          </div>
          <p className={`text-sm font-semibold ${avgGradeInfo.color}`}>
            {avgGradeInfo.label}
          </p>
        </div>
        {/* Average progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-2.5 rounded-full bg-linear-to-r from-blue-500 to-indigo-600 transition-all duration-700"
            style={{ width: `${averageScore}%` }}
          />
        </div>
      </div>

      {/* Per-Subject Bars */}
      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          No subjects enrolled for the current term.
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {subjectScores.map(({ subject, score }, index) => {
            const palette = BAR_COLORS[index % BAR_COLORS.length];
            const gradeInfo = getGradeInfo(score);

            return (
              <div key={subject.name} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 truncate max-w-[55%]">
                    {subject.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded ${palette.track} ${palette.text}`}
                    >
                      {gradeInfo.grade}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 w-10 text-right">
                      {score}%
                    </span>
                  </div>
                </div>
                <div
                  className={`w-full ${palette.track} rounded-full h-2 overflow-hidden`}
                >
                  <div
                    className={`${palette.bg} h-2 rounded-full transition-all duration-700`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
