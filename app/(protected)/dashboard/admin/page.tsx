'use client';

import { MetricCard, Card } from '@/src/components/ui/Card';
import { useAdminRecentActivity, useAdminStats } from '@/src/hooks/queries/useAdmin';
import { Loader } from '@/src/components/ui/Loader';
import Link from 'next/link';
import { naira } from '../bursar/components/methodbadge';

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
  const activityQuery = useAdminRecentActivity();

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
          // value={`$${statsData?.totalRevenue || 0}`}
          value={`${naira(statsData?.totalRevenue) || 0}`}
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
      

      {/* Recent Activity */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        {activityQuery.isLoading ? <div className="flex h-24 items-center justify-center"><Loader /></div> : activityQuery.isError ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700"><span>Recent activity could not be loaded.</span><button onClick={() => void activityQuery.refetch()} className="font-semibold underline">Retry</button></div>
        ) : activityQuery.data?.length ? (
          <div className="divide-y divide-gray-100">
            {activityQuery.data.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                <div className="min-w-0 flex-1">
                  <p className="break-all text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="mt-1 text-xs text-gray-500">{new Date(activity.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="py-6 text-center text-sm text-gray-500">No admin activity recorded yet. Changes made through the portal will appear here.</p>}
      </Card>
    </div>
  );
}
