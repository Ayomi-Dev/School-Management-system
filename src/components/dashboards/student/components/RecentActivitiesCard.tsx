'use client';

import { Card } from '@/src/components/ui/Card';

interface Activity {
  id: string;
  type: 'assignment' | 'grade' | 'announcement' | 'event';
  title: string;
  description: string;
  timestamp: string;
}

interface RecentActivitiesCardProps {
  activities?: Activity[];
}

export function RecentActivitiesCard({ activities = [] }: RecentActivitiesCardProps) {
  const defaultActivities: Activity[] = [
    {
      id: '1',
      type: 'assignment',
      title: 'Mathematics Assignment Submitted',
      description: 'Chapter 5 - Quadratic Equations assignment submitted successfully',
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      type: 'grade',
      title: 'Physics Test Result',
      description: 'Your Physics test score: 85/100 - Excellent performance!',
      timestamp: '1 day ago',
    },
    {
      id: '3',
      type: 'announcement',
      title: 'School Closure Notice',
      description: 'School will be closed on Friday, 15th due to Teachers\' Conference',
      timestamp: '2 days ago',
    },
    {
      id: '4',
      type: 'event',
      title: 'Inter-House Sports Competition',
      description: 'Participate in the upcoming Inter-House Sports event on the 20th',
      timestamp: '3 days ago',
    },
    {
      id: '5',
      type: 'assignment',
      title: 'English Essay Assignment',
      description: 'New assignment: Write a 500-word essay on "Technology and Society"',
      timestamp: '4 days ago',
    },
  ];

  const recentActivities = activities.length > 0 ? activities : defaultActivities;

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'assignment':
        return '📝';
      case 'grade':
        return '⭐';
      case 'announcement':
        return '📢';
      case 'event':
        return '🎯';
      default:
        return '📌';
    }
  };

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'assignment':
        return 'left-blue-500 bg-blue-50';
      case 'grade':
        return 'left-green-500 bg-green-50';
      case 'announcement':
        return 'left-purple-500 bg-purple-50';
      case 'event':
        return 'left-orange-500 bg-orange-50';
      default:
        return 'left-gray-500 bg-gray-50';
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Recent Activities</h2>

      <div className="space-y-4">
        {recentActivities.map((activity) => (
          <div
            key={activity.id}
            className={`p-4 rounded-lg border-l-4 ${getActivityColor(activity.type)} hover:shadow-md transition`}
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl">{getActivityIcon(activity.type)}</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{activity.title}</p>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-2">{activity.timestamp}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
