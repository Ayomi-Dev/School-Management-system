'use client';

import { Card } from '@/src/components/ui/Card';

interface PerformanceChartProps {
  averageScore?: number;
  subjectsCount?: number;
}

export function PerformanceCard({ averageScore = 78, subjectsCount = 0 }: PerformanceChartProps) {
  const subjects = [
    { name: 'Mathematics', score: 85, color: 'bg-blue-500' },
    { name: 'English', score: 78, color: 'bg-green-500' },
    { name: 'Science', score: 82, color: 'bg-purple-500' },
    { name: 'History', score: 75, color: 'bg-yellow-500' },
    { name: 'Geography', score: 80, color: 'bg-red-500' },
  ];

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📊 Performance Overview</h2>
        <p className="text-gray-600">Your academic performance across subjects</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 font-semibold">Average Score</span>
          <span className="text-3xl font-bold text-blue-600">{averageScore}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-linear-to-r from-blue-500 to-blue-600 h-3 rounded-full"
            style={{ width: `${averageScore}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">{getScoreLabel(averageScore)}</p>
      </div>

      <div className="space-y-3">
        {subjects.map((subject) => (
          <div key={subject.name} className="flex items-center gap-4">
            <span className="w-24 text-sm font-medium text-gray-700">{subject.name}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`${subject.color} h-2 rounded-full transition-all`}
                    style={{ width: `${subject.score}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-12 text-right">{subject.score}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
