'use client';

import { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { DataTable } from '@/src/components/ui/DataTable';
import { Download, Filter } from 'lucide-react';

const mockAcademicData = [
  { id: '1', className: 'JSS1A', totalStudents: 45, avgScore: 72.5, passRate: '88%' },
  { id: '2', className: 'JSS1B', totalStudents: 42, avgScore: 68.3, passRate: '82%' },
  { id: '3', className: 'JSS2A', totalStudents: 48, avgScore: 75.1, passRate: '92%' },
  { id: '4', className: 'SS1', totalStudents: 40, avgScore: 73.6, passRate: '90%' },
];

export default function AcademicReportsPage() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Academic Reports</h1>
          <p className="text-gray-600 mt-1">View class and student performance</p>
        </div>
        <Button className="flex items-center gap-2">
          <Download size={18} />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Classes</option>
              <option value="JSS1A">JSS1A</option>
              <option value="JSS1B">JSS1B</option>
              <option value="JSS2A">JSS2A</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Terms</option>
              <option value="TERM1">Term 1</option>
              <option value="TERM2">Term 2</option>
              <option value="TERM3">Term 3</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <Filter size={18} />
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-sm text-gray-600">Total Students</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">175</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-600">Average Score</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">72.4</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-600">Pass Rate</p>
          <p className="text-3xl font-bold text-green-600 mt-2">88%</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-600">Fail Rate</p>
          <p className="text-3xl font-bold text-red-600 mt-2">12%</p>
        </Card>
      </div>

      {/* Class Performance Table */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Class Performance</h2>
        <DataTable
          data={mockAcademicData}
          columns={[
            {
              key: 'className',
              label: 'Class',
            },
            {
              key: 'totalStudents',
              label: 'Students',
            },
            {
              key: 'avgScore',
              label: 'Average Score',
              render: (value) => (
                <span className="font-medium">{value as number}%</span>
              ),
            },
            {
              key: 'passRate',
              label: 'Pass Rate',
              render: (value) => (
                <span className="text-green-600 font-medium">{value as string}</span>
              ),
            },
          ]}
          rowActions={() => (
            <Button variant="outline" size="sm">
              View Details
            </Button>
          )}
        />
      </Card>

      {/* Top Performers */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Top 5 Performers</h2>
        <div className="space-y-3">
          {['Chioma Adebayo (92%)', 'Okafor Chinedu (91%)', 'Ngozi Obi (90%)', 'Adekunle Bello (89%)', 'Zainab Hassan (88%)'].map((student, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
                <span className="font-medium text-gray-900">{student}</span>
              </div>
              <span className="text-sm text-green-600 font-semibold">⭐</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
