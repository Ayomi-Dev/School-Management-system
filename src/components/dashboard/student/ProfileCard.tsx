'use client';

import { Card } from '@/src/components/ui/Card';
import { User } from '@/src/types';

interface ProfileCardProps {
  user?: User;
  studentInfo?: {
    registrationNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    class?: string;
    guardianCount?: number;
  };
}

export function ProfileCard({ user, studentInfo }: ProfileCardProps) {
  const defaultInfo = {
    registrationNumber: 'SMS-2024-0001',
    dateOfBirth: '2008-03-15',
    gender: 'Male',
    class: 'Senior Secondary 1 (SS1)',
    guardianCount: 2,
  };

  const info = studentInfo || defaultInfo;

  const getInitials = (firstName?: string, lastName?: string): string => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">👤 Student Profile</h2>

      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl font-bold text-white">{getInitials(user?.firstName, user?.lastName)}</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-800">
          {user?.firstName} {user?.lastName}
        </h3>
        <p className="text-gray-600 text-sm">{user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Registration Number</p>
          <p className="text-lg font-semibold text-gray-800">{info.registrationNumber}</p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Class</p>
          <p className="text-lg font-semibold text-gray-800">{info.class}</p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Date of Birth</p>
          <p className="text-lg font-semibold text-gray-800">
            {new Date(info.dateOfBirth || '').toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Gender</p>
          <p className="text-lg font-semibold text-gray-800">{info.gender}</p>
        </div>

        <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Phone</p>
          <p className="text-lg font-semibold text-gray-800">{user?.phone || 'N/A'}</p>
        </div>

        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Guardians</p>
          <p className="text-lg font-semibold text-gray-800">{info.guardianCount} Guardian(s)</p>
        </div>
      </div>
    </Card>
  );
}
