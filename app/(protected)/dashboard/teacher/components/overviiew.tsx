import { AlertCircle, ArrowRight, BookOpen, CalendarCheck, CheckCircle2, ClipboardList, Clock, FileText, Trophy, Users } from "lucide-react";
import { ActivityEvent, AttendanceState, TeacherOverviewResponse } from "./teacher";
import { useRouter } from "next/navigation";
import { Card } from "@/src/components/ui/Card";

type SubjectSection = NonNullable<TeacherOverviewResponse['data']['subjectSection']>;
type ClassSection = NonNullable<TeacherOverviewResponse['data']['classSection']>;
interface AttendanceCardProps {
  state:       AttendanceState;
  marked:      number;
  total:       number;
  classId:     string;
  sessionId:   string | null;
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  attendance:  <CalendarCheck size={15} className="text-emerald-600" />,
  score:       <ClipboardList size={15} className="text-blue-600"    />,
  report_card: <FileText size={15} className="text-violet-600"  />,
};
 
// ─── activity feed ────────────────────────────────────────────────────────────

function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        No recent activity yet this term.
      </p>
    );
  }

  return (
    <ul className="space-y-0 divide-y divide-gray-50">
      {events.map((event, idx) => (
        <li key={idx} className="flex items-start gap-3 py-3">
          <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-100
                          flex items-center justify-center shrink-0 mt-0.5">
            {ACTIVITY_ICON[event.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{event.label}</p>
            <p className="text-xs text-gray-500 truncate">{event.detail}</p>
          </div>
          <p className="text-xs text-gray-400 shrink-0 mt-0.5">{timeAgo(event.timestamp)}</p>
        </li>
      ))}
    </ul>
  );
}

// ─── attendance status card ───────────────────────────────────────────────────
export function AttendanceStatusCard({
  state,
  marked,
  total,
  classId,
  sessionId,
}: AttendanceCardProps) {
  const router = useRouter()

  const config = {
    not_started: {
      icon:    <AlertCircle size={20} className="text-amber-500" />,
      label:   "Attendance not marked today",
      sub:     "Tap to mark now",
      bg:      "bg-amber-50 border-amber-200",
      textCls: "text-amber-800",
    },
    in_progress: {
      icon:    <Clock size={20} className="text-blue-500" />,
      label:   `Attendance in progress`,
      sub:     `${marked} of ${total} students marked`,
      bg:      "bg-blue-50 border-blue-200",
      textCls: "text-blue-800",
    },
    completed: {
      icon:    <CheckCircle2 size={20} className="text-emerald-500" />,
      label:   "Attendance complete",
      sub:     `All ${total} students marked`,
      bg:      "bg-emerald-50 border-emerald-200",
      textCls: "text-emerald-800",
    },
  }[state];

  return (
    <button
      onClick={() =>
        router.push(`/dashboard/teacher/classes/${classId}/attendance/mark`)
      }
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border
                  ${config.bg} transition-opacity hover:opacity-90 text-left`}
    >
      {config.icon}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${config.textCls}`}>{config.label}</p>
        <p className="text-xs text-gray-500">{config.sub}</p>
      </div>
      {state !== 'completed' && (
        <ArrowRight size={16} className="text-gray-400 shrink-0" />
      )}
    </button>
  );
}

// ─── stat pill ────────────────────────────────────────────────────────────────

export function StatPill({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─── class teacher section ────────────────────────────────────────────────────


export function ClassTeacherSection({
  section,
}: {
  section: ClassSection;
}) {
  const router = useRouter();

  const rcPct =
    section.reportCards.totalEnrolled > 0
      ? Math.round((section.reportCards.compiledCount / section.reportCards.totalEnrolled) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          {section.className} — Class Overview
        </h2>
        <button
          onClick={() =>
            router.push(`/dashboard/teacher/classes/${section.classId}/students/list`)
          }
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium
                     flex items-center gap-1 cursor-pointer"
        >
          View students <ArrowRight size={12} />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatPill
          icon={<Users size={16} className="text-blue-600" />}
          label="Students"
          value={section.studentCount}
        />
        <StatPill
          icon={<FileText size={16} className="text-violet-600" />}
          label="Report Cards"
          value={`${section.reportCards.compiledCount}/${section.reportCards.totalEnrolled}`}
          sub={`${section.reportCards.publishedCount} published`}
        />
        <StatPill
          icon={<Trophy size={16} className="text-amber-500" />}
          label="Pending Cards"
          value={section.reportCards.pendingCount}
          sub={`${rcPct}% compiled`}
        />
      </div>

      {/* Today's attendance banner */}
      <AttendanceStatusCard
        state={section.attendance.state}
        marked={section.attendance.markedCount}
        total={section.attendance.totalCount || section.studentCount}
        classId={section.classId}
        sessionId={section.attendance.sessionId}
      />

      {/* Report card progress bar */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Report Card Progress</span>
          <button
            onClick={() =>
              router.push(
                `/dashboard/teacher/classes/${section.classId}/report-cards/compile`,
              )
            }
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium
                       flex items-center gap-1"
          >
            Compile <ArrowRight size={12} />
          </button>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${rcPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{section.reportCards.compiledCount} compiled</span>
          <span>{section.reportCards.publishedCount} published</span>
          <span>{section.reportCards.pendingCount} pending</span>
        </div>
      </div>

      {/* Activity feed */}
      <Card>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
          Recent Activity
        </h3>
        <ActivityFeed events={section.recentActivity} />
      </Card>
    </div>
  );
}

// ─── subject teacher section ─────────────────────────────────────────────────


export function SubjectTeacherSection({ section }: { section: SubjectSection }) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
        My Subject Assignments
      </h2>

      {/* Per-class subject cards */}
      <div className="space-y-3">
        {section.classes.map((cls) => (
          <Card key={cls.classId} className="py-3!">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">{cls.className}</p>
              <button
                onClick={() =>
                  router.push(`/dashboard/teacher/classes/${cls.classId}/subjects`)
                }
                className="text-xs text-blue-600 hover:text-blue-700 font-medium
                           flex items-center gap-1"
              >
                Enter scores <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-1">
              {cls.subjects.map((subject) => (
                <button
                  key={subject.subjectId}
                  onClick={() =>
                    router.push(
                      `/dashboard/teacher/classes/${cls.classId}/subjects/${subject.subjectId}/scores`,
                    )
                  }
                  className="w-full flex items-center justify-between px-3 py-2
                             rounded-lg hover:bg-gray-50 transition-colors group text-left"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700">{subject.subjectName}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 group-hover:text-gray-600">
                    {subject.lastEntryAt
                      ? `Last entry ${timeAgo(subject.lastEntryAt)}`
                      : 'No scores yet'}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Subject activity feed */}
      <Card>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
          Recent Score Activity
        </h3>
        <ActivityFeed events={section.recentActivity} />
      </Card>
    </div>
  );
}