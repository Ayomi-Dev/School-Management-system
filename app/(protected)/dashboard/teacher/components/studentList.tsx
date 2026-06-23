
import { BookOpen, CalendarCheck, ChevronRight, ClipboardList } from "lucide-react";
export interface Student {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  status: string;
  user: { userCode: string; status: string };
}
interface StudentCardProps {
  student: Student;
  classId: string;
  onViewProfile: (studentId: string) => void;
  onScores: (studentId: string) => void;
  onAttendance: (studentId: string) => void;
  onAssignments: (studentId: string) => void;
}
interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  title: string;
  onClick: () => void;
}


function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}
// Gender-neutral avatar background derived from the student's name so the
// same student always gets the same colour across sessions — not random,
// not arbitrary.
const AVATAR_PALETTES = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
];

function getAvatarClass(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
  SUSPENDED: 'bg-red-50 text-red-600',
};


function ActionButton({ icon, label, title, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // prevent card-level click from firing
        onClick();
      }}
      title={title}
      className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-50
                 transition-colors text-gray-500 hover:text-gray-900 border border-transparent
                 hover:border-gray-200"
    >
      {icon}
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
}

// ─── student card ────────────────────────────────────────────────────────────



export function StudentCard({
  student,
  classId,
  onViewProfile,
  onScores,
  onAttendance,
  onAssignments,
}: StudentCardProps) {
  const avatarClass = getAvatarClass(student.firstName + student.lastName);
  const statusStyle = STATUS_STYLE[student.status] ?? 'bg-gray-100 text-gray-500';

  return (
    <div
      onClick={() => onViewProfile(student.id)}
      className="bg-white rounded-xl border border-gray-200 hover:border-gray-300
                 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Top: identity */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center
                      text-sm font-bold shrink-0 ${avatarClass}`}
        >
          {getInitials(student.firstName, student.lastName)}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate leading-tight">
            {student.firstName} {student.lastName}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{student.studentNumber}</p>
        </div>

        {/* Status badge + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide
                         px-2 py-0.5 rounded-full ${statusStyle}`}
          >
            {student.status}
          </span>
          <ChevronRight size={15} className="text-gray-300" />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mx-4" />

      {/* Bottom: action buttons */}
      <div
        className="flex items-center justify-around px-2 py-2"
        onClick={(e) => e.stopPropagation()} // actions row doesn't navigate to profile
      >
        <ActionButton
          icon={<BookOpen size={16} />}
          label="Scores"
          title="Enter or view scores"
          onClick={() => onScores(student.id)}
        />
        <ActionButton
          icon={<CalendarCheck size={16} />}
          label="Attendance"
          title="Mark or view attendance"
          onClick={() => onAttendance(student.id)}
        />
        <ActionButton
          icon={<ClipboardList size={16} />}
          label="Assignments"
          title="View assignments"
          onClick={() => onAssignments(student.id)}
        />
      </div>
    </div>
  );
}