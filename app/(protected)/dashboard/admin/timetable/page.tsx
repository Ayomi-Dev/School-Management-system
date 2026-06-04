'use client';

import { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Plus } from 'lucide-react';
import CreateTimetableSlotModal from './components/CreateTimetableSlotModal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00'
];

const mockTimetable = {
  'Monday_08:00': { subject: 'Mathematics', teacher: 'John Smith', room: 'A1' },
  'Tuesday_10:00': { subject: 'English', teacher: 'Jane Doe', room: 'B2' },
};

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState('JSS1A');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Timetable Management</h1>
          <p className="text-gray-600 mt-1">View and manage class schedules</p>
        </div>
        <Button
          variant="primary"
          className="flex items-center gap-2"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={18} />
          Add Slot
        </Button>
      </div>

      {/* Class Selector */}
      <Card>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="JSS1A">JSS1A</option>
            <option value="JSS1B">JSS1B</option>
            <option value="JSS2A">JSS2A</option>
            <option value="SS1">SS1</option>
          </select>
        </div>
      </Card>

      {/* Timetable Grid */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Time</th>
              {DAYS.map((day) => (
                <th key={day} className="px-4 py-3 text-center font-semibold text-gray-900">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {TIME_SLOTS.map((time) => (
              <tr key={time} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 bg-gray-50">
                  {time}
                </td>
                {DAYS.map((day) => {
                  const slot = mockTimetable[`${day}_${time}` as keyof typeof mockTimetable];
                  return (
                    <td
                      key={`${day}-${time}`}
                      className="px-4 py-3 border-l border-gray-200"
                    >
                      {slot ? (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="font-medium text-sm text-blue-900">{slot.subject}</p>
                          <p className="text-xs text-blue-700">{slot.teacher}</p>
                          <p className="text-xs text-blue-600">Room {slot.room}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="w-full h-12 border-2 border-dashed border-gray-300 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-400 text-xs"
                        >
                          +
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Legend */}
      <Card>
        <p className="text-sm font-medium text-gray-900 mb-3">Legend</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded" />
            <span className="text-sm text-gray-600">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-dashed border-gray-300 rounded" />
            <span className="text-sm text-gray-600">Available</span>
          </div>
        </div>
      </Card>

      {/* Modal */}
      {isCreateModalOpen && (
        <CreateTimetableSlotModal
          classId={selectedClass}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}
