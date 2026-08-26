'use client';

import { Card } from '@/src/components/ui/Card';
import { StudentProfile} from '@/src/types/api';

interface WelcomeCardProps {
  profile: StudentProfile
}

export function WelcomeCard({ profile }: WelcomeCardProps) {
  const greeting = getGreeting();
  console.log(greeting, profile)

  return (
    <Card className="bg-linear-to-r from-blue-600 to-blue-800 text-white p-8 rounded-lg shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            🎯 {greeting}, {profile?.firstName}!
          </h1>
          <p className="text-blue-100 text-lg">
            Welcome back to your dashboard. You're all caught up!
          </p>
        </div>
        <div className="text-6xl">📚</div>
      </div>
    </Card>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}
