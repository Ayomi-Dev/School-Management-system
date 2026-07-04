'use client';

import { Card } from '@/src/components/ui/Card';
import { StudentProfile } from '@/src/types';

interface ProfileCardProps {
  profile: StudentProfile 
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const getInitials = (firstName?: string, lastName?: string): string => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">👤 Student Profile</h2>

      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl font-bold text-white">{getInitials(profile?.firstName, profile?.lastName)}</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-800">
          {profile?.firstName} {profile?.lastName}
        </h3>
        {/* <p className="text-gray-600 text-sm">{profile?.email}</p> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Registration Number</p>
          <p className="text-lg font-semibold text-gray-800">{profile.studentNumber}</p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Class</p>
          <p className="text-lg font-semibold text-gray-800">{profile.level}</p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Date of Birth</p>
          <p className="text-lg font-semibold text-gray-800">
            {new Date(profile.dateOfBirth || '').toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Gender</p>
          <p className="text-lg font-semibold text-gray-800">{profile.gender}</p>
        </div>

        <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Phone</p>
          <p className="text-lg font-semibold text-gray-800">{profile?.phone || 'N/A'}</p>
        </div>

        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Guardian</p>
          <p className="text-lg font-semibold text-gray-800">{profile?.guardian.firstName} {profile?.guardian.lastName}</p>
        </div>
      </div>
    </Card>
  );
}
