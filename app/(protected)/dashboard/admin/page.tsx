'use client';

import { MetricCard, Card } from '@/src/components/ui/Card';
import { useAdminStats } from '@/src/hooks/queries/useAdmin';
import { Loader } from '@/src/components/ui/Loader';
import Link from 'next/link';

const QuickAction = ({ label, description, icon, href }: any) => (
  <Link
    href={href}
    className="p-4 hover:bg-blue-50 rounded-lg border border-gray-200 transition-colors"
  >
    <div className="text-2xl mb-2">{icon}</div>
    <p className="font-medium text-gray-900 text-sm">{label}</p>
    <p className="text-xs text-gray-500 mt-1">{description}</p>
  </Link>
);

export default function AdminDashboardPage() {
  const { data: stats,  isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader />
      </div>
    ); 
  }
  const statsData = stats?.data || {};

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your school overview.</p>
      </div>

      {/* Key Metrics */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Key Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          href='/dashboard/admin/users?type=STUDENT'
          label="Total Students"
          value={statsData?.totalStudents || 0}
          icon="🎓"
          color="blue"
          trend={{ value: 5, isPositive: true }}
        />
        <MetricCard
          href='/dashboard/admin/users?type=TEACHER'
          label="Total Teachers"
          value={statsData?.totalTeachers || 0}
          icon="👨‍🏫"
          color="green"
          trend={{ value: 2, isPositive: true }}
        />
        <MetricCard
          href='/dashboard/admin/users?type=PARENT'
          label="Total Parents"
          value={statsData?.totalParents || 0}
          icon="👨‍👩‍👧‍👦"
          color="purple"
          trend={{ value: 3, isPositive: true }}
        />
        <MetricCard
          href='/dashboard/admin/users?type=fees'
          label="Total Revenue"
          value={`$${statsData?.totalRevenue || 0}`}
          icon="💰"
          color="orange"
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          href='/dashboard/admin/classes'
          label="Active Classes"
          value={statsData?.activeClasses || 0}
          icon="🏫"
          color="red"
          trend={{ value: 0, isPositive: false }}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <QuickAction
            label="Add User"
            description="Create new student, teacher or parent"
            icon="➕"
            href="/dashboard/admin/users?action=create"
          />
          <QuickAction
            label="Create Class"
            description="Add a new class"
            icon="🏫"
            href="/dashboard/admin/classes?action=create"
          />
          <QuickAction
            label="Manage Subjects"
            description="View and manage subjects"
            icon="📖"
            href="/dashboard/admin/subjects"
          />
          <QuickAction
            label="View Timetable"
            description="See weekly schedule"
            icon="⏰"
            href="/dashboard/admin/timetable"
          />
          <QuickAction
            label="Academic Sessions"
            description="Manage academic years"
            icon="📅"
            href="/dashboard/admin/sessions"
          />
          <QuickAction
            label="Generate Reports"
            description="Academic & financial"
            icon="📊"
            href="/dashboard/admin/reports"
          />
          <QuickAction
            label="System Settings"
            description="Configure system"
            icon="⚙️"
            href="/dashboard/admin/settings"
          />
          <QuickAction
            label="View Attendance"
            description="Check attendance records"
            icon="✓"
            href="/dashboard/admin/reports/attendance"
          />
        </div>
      </div>

      {/* System Health */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 mb-4">System Health</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Database Status</p>
              <p className="text-sm text-gray-600">All systems operational</p>
            </div>
            <span className="text-2xl">✓</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">API Response Time</p>
              <p className="text-sm text-gray-600">200ms average</p>
            </div>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Last Backup</p>
              <p className="text-sm text-gray-600">2 hours ago</p>
            </div>
            <span className="text-2xl">💾</span>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  New user registered
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {i} hour{i > 1 ? 's' : ''} ago
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
