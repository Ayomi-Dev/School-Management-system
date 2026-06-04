'use client';

import { useState } from 'react';
import { useSettings, useUpdateSettingsMutation } from '@/src/hooks/queries/useAdmin';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loader } from '@/src/components/ui/Loader';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const { data: settingsData, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettingsMutation();
  const [formData, setFormData] = useState({
    schoolName: 'Saint Mary School',
    schoolEmail: 'info@stmary.edu.ng',
    schoolPhone: '+234-1-2345-6789',
    maxStudentsPerClass: '50',
    attendanceThreshold: '80',
    feeDueDate: '2024-01-31',
    academicCalendarStart: '2024-01-15',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettingsMutation.mutateAsync(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-1">Configure system-wide settings and preferences</p>
      </div>

      {/* School Information */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 mb-4">School Information</h2>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name
              </label>
              <Input
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Email
              </label>
              <Input
                type="email"
                value={formData.schoolEmail}
                onChange={(e) => setFormData({ ...formData, schoolEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Phone
              </label>
              <Input
                value={formData.schoolPhone}
                onChange={(e) => setFormData({ ...formData, schoolPhone: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Card>

      {/* Academic Settings */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Academic Settings</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Students Per Class
              </label>
              <Input
                type="number"
                value={formData.maxStudentsPerClass}
                onChange={(e) =>
                  setFormData({ ...formData, maxStudentsPerClass: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attendance Threshold (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.attendanceThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, attendanceThreshold: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Calendar Start
              </label>
              <Input
                type="date"
                value={formData.academicCalendarStart}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    academicCalendarStart: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fee Due Date
              </label>
              <Input
                type="date"
                value={formData.feeDueDate}
                onChange={(e) => setFormData({ ...formData, feeDueDate: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Role & Permissions */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Roles & Permissions</h2>
        <div className="space-y-3">
          {['Admin', 'Teacher', 'Student', 'Parent', 'Bursar'].map((role) => (
            <div
              key={role}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <span className="font-medium text-gray-900">{role}</span>
              <Button variant="outline" size="sm">
                Manage Permissions
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Notification Settings */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Notification Settings</h2>
        <div className="space-y-3">
          {[
            { label: 'Email Notifications', description: 'Send email alerts to users' },
            { label: 'SMS Notifications', description: 'Send SMS messages to users' },
            { label: 'System Alerts', description: 'System status and alerts' },
          ].map((setting) => (
            <div key={setting.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{setting.label}</p>
                <p className="text-sm text-gray-600">{setting.description}</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
          ))}
        </div>
      </Card>

      {/* Backup & Data */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Backup & Data</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Last Backup</p>
              <p className="text-sm text-gray-600">2 hours ago</p>
            </div>
            <Button variant="outline" size="sm">
              Backup Now
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Export Data</p>
              <p className="text-sm text-gray-600">Download system data as CSV</p>
            </div>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => window.location.reload()}
        >
          Discard Changes
        </Button>
        <Button
          variant="primary"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={handleSubmit}
          loading={updateSettingsMutation.isPending}
        >
          <Save size={18} />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
