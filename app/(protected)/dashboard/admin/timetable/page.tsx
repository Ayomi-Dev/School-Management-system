'use client';

import { useMemo, useState } from 'react';
import { useClassesList } from '@/src/hooks/queries/useAdmin';
import {
  useClassTimetable,
  useDeleteSlotMutation,
} from '@/src/hooks/queries/useAdmin';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';
import TimetableSlotModal from './components/CreateTimetableSlotModal';
import type { TimetableSlot, DayOfWeek } from '@/src/types/timetable';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  AlertCircle,
  BookOpen,
  User,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 'MONDAY',    label: 'Monday',    short: 'Mon' },
  { value: 'TUESDAY',   label: 'Tuesday',   short: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
  { value: 'THURSDAY',  label: 'Thursday',  short: 'Thu' },
  { value: 'FRIDAY',    label: 'Friday',    short: 'Fri' },
];

// Grid rows: 07:00 – 17:00 in 30-minute steps
const GRID_START  = 7 * 60;   // minutes from midnight
const GRID_END    = 17 * 60;
const STEP        = 30;

const TIME_ROWS: string[] = [];
for (let m = GRID_START; m < GRID_END; m += STEP) {
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm  = String(m % 60).padStart(2, '0');
  TIME_ROWS.push(`${hh}:${mm}`);
}

// Convert "HH:MM" to minutes from midnight
function toMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Pixel height per minute
const PX_PER_MIN = 1.4;  // 30-min row = 42px

// ─── Slot pill ────────────────────────────────────────────────────────────────

// A palette of colours to distinguish subjects visually
const PILL_COLORS = [
  { bg: 'bg-blue-50   border-blue-200',   text: 'text-blue-900',   sub: 'text-blue-600',   dot: 'bg-blue-400'   },
  { bg: 'bg-violet-50 border-violet-200', text: 'text-violet-900', sub: 'text-violet-600', dot: 'bg-violet-400' },
  { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-900', sub: 'text-emerald-600', dot: 'bg-emerald-400' },
  { bg: 'bg-amber-50  border-amber-200',  text: 'text-amber-900',  sub: 'text-amber-600',  dot: 'bg-amber-400'  },
  { bg: 'bg-rose-50   border-rose-200',   text: 'text-rose-900',   sub: 'text-rose-600',   dot: 'bg-rose-400'   },
  { bg: 'bg-cyan-50   border-cyan-200',   text: 'text-cyan-900',   sub: 'text-cyan-600',   dot: 'bg-cyan-400'   },
  { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-900', sub: 'text-orange-600', dot: 'bg-orange-400' },
];

function pillColor(subjectId: string) {
  // Stable colour per subject: hash the id
  let hash = 0;
  for (const ch of subjectId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return PILL_COLORS[hash % PILL_COLORS.length];
}

function SlotPill({
  slot,
  onEdit,
  onDelete,
  deleting,
}: {
  slot:     TimetableSlot;
  onEdit:   () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const startMin  = toMin(slot.startTime);
  const endMin    = toMin(slot.endTime);
  const topPx     = (startMin - GRID_START) * PX_PER_MIN;
  const heightPx  = (endMin - startMin) * PX_PER_MIN;
  const c         = pillColor(slot.subject.id);
  const short     = (endMin - startMin) <= 30; // ≤30 min: compact layout

  return (
    <div
      className={`absolute inset-x-1 rounded-lg border ${c.bg} overflow-hidden group`}
      style={{ top: topPx, height: Math.max(heightPx, 36) }}
    >
      <div className="flex flex-col h-full px-2 py-1.5 min-w-0">
        {short ? (
          // Compact: single line
          <p className={`text-[11px] font-semibold truncate ${c.text}`}>
            {slot.subject.name}
          </p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-1">
              <p className={`text-xs font-bold leading-tight truncate flex-1 ${c.text}`}>
                {slot.subject.name}
              </p>
              {/* Action buttons — appear on hover */}
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-0.5 rounded hover:bg-black/10 transition-colors"
                  title="Edit slot"
                >
                  <Edit2 size={10} className={c.text} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  disabled={deleting}
                  className="p-0.5 rounded hover:bg-red-100 transition-colors"
                  title="Delete slot"
                >
                  <Trash2 size={10} className="text-red-500" />
                </button>
              </div>
            </div>
            {heightPx > 50 && (
              <p className={`text-[10px] truncate mt-0.5 ${c.sub}`}>
                {slot.teacher.user.firstName} {slot.teacher.user.lastName}
              </p>
            )}
            {heightPx > 66 && slot.room && (
              <p className={`text-[10px] ${c.sub}`}>Room {slot.room}</p>
            )}
            <p className={`text-[10px] mt-auto ${c.sub}`}>
              {slot.startTime}–{slot.endTime}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Empty cell click target ──────────────────────────────────────────────────

function EmptyCell({
  day,
  time,
  onClick, 
}: {
  day:     DayOfWeek;
  time:    string;
  onClick: (day: DayOfWeek, time: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(day, time)}
      className="absolute inset-x-1 rounded-lg border-2 border-dashed border-transparent hover:border-blue-300 hover:bg-blue-50/60 transition-colors"
      style={{ top: 0, bottom: 0 }}
      aria-label={`Add slot ${day} ${time}`}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TimetablePage() {
  const { data: classesData, isLoading: classesLoading } = useClassesList();
  const classes = useMemo(() => classesData?.data?.data ?? [], [classesData]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Set first class once loaded
  useMemo(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const { data: timetable, isLoading: timetableLoading } =
    useClassTimetable(selectedClassId);

  const deleteMutation = useDeleteSlotMutation(selectedClassId);

  // Modal state
  const [modalOpen, setModalOpen]       = useState(false);
  const [editSlot, setEditSlot]         = useState<TimetableSlot | undefined>(undefined);
  const [prefillDay, setPrefillDay]     = useState<DayOfWeek | undefined>(undefined);
  const [prefillTime, setPrefillTime]   = useState<string | undefined>(undefined);

  const openCreate = (day?: DayOfWeek, time?: string) => {
    setEditSlot(undefined);
    setPrefillDay(day);
    setPrefillTime(time);
    setModalOpen(true);
  };

  const openEdit = (slot: TimetableSlot) => {
    setEditSlot(slot);
    setPrefillDay(undefined);
    setPrefillTime(undefined);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditSlot(undefined);
  };

  // Build a lookup: day → list of slots (sorted by startTime)
  const slotsByDay = useMemo(() => {
    const map = new Map<DayOfWeek, TimetableSlot[]>();
    DAYS.forEach((d) => map.set(d.value, []));
    (timetable?.slots ?? []).forEach((s) => {
      map.get(s.dayOfWeek)?.push(s);
    });
    return map;
  }, [timetable]);

  // Summary stats
  const totalSlots    = timetable?.slots.length ?? 0;
  const uniqueSubjects = new Set(timetable?.slots.map((s) => s.subject.id)).size;
  const uniqueTeachers = new Set(timetable?.slots.map((s) => s.teacher.id)).size;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage class schedules</p>
        </div>
        <Button
          variant="primary"
          className="flex items-center gap-2"
          onClick={() => openCreate()}
          disabled={!selectedClassId}
        >
          <Plus size={16} />
          Add Slot
        </Button>
      </div>

      {/* Class selector + stats row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600 shrink-0">Class:</label>
          {classesLoading ? (
            <div className="w-40 h-9 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.level}</option>
              ))}
            </select>
          )}
        </div>

        {/* Stats chips */}
        {timetable && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full font-medium">
              <Clock size={12} />{totalSlots} slot{totalSlots !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full font-medium">
              <BookOpen size={12} />{uniqueSubjects} subject{uniqueSubjects !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">
              <User size={12} />{uniqueTeachers} teacher{uniqueTeachers !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Grid */}
      <Card className="overflow-x-auto p-0">
        {timetableLoading ? (
          <div className="flex items-center justify-center h-80">
            <Loader />
          </div>
        ) : !selectedClassId ? (
          <div className="flex flex-col items-center justify-center h-60 gap-2 text-gray-400">
            <AlertCircle size={28} />
            <p className="text-sm">Select a class to view its timetable.</p>
          </div>
        ) : (
          <div className="min-w-160">
            {/* Day header row */}
            <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '64px repeat(5, 1fr)' }}>
              <div className="px-3 py-3 bg-gray-50 border-r border-gray-100" />
              {DAYS.map((d) => (
                <div
                  key={d.value}
                  className="px-3 py-3 bg-gray-50 border-r border-gray-100 last:border-r-0 text-center"
                >
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide hidden sm:block">
                    {d.label}
                  </p>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide sm:hidden">
                    {d.short}
                  </p>
                </div>
              ))}
            </div>

            {/* Time + slot columns */}
            <div className="grid relative" style={{ gridTemplateColumns: '64px repeat(5, 1fr)' }}>
              {/* Time gutter */}
              <div className="border-r border-gray-100 bg-gray-50">
                {TIME_ROWS.map((time, i) => (
                  <div
                    key={time}
                    className="flex items-start justify-end pr-2 pt-0.5"
                    style={{ height: STEP * PX_PER_MIN }}
                  >
                    {/* Only show label on the hour */}
                    {time.endsWith(':00') ? (
                      <span className="text-[10px] text-gray-400 font-medium">{time}</span>
                    ) : (
                      <span className="text-[10px] text-gray-200">·</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {DAYS.map((d) => {
                const daySlots = slotsByDay.get(d.value) ?? [];
                const totalHeight = (GRID_END - GRID_START) * PX_PER_MIN;

                return (
                  <div
                    key={d.value}
                    className="relative border-r border-gray-100 last:border-r-0"
                    style={{ height: totalHeight }}
                  >
                    {/* Hour / half-hour gridlines */}
                    {TIME_ROWS.map((time) => (
                      <div
                        key={time}
                        className="absolute inset-x-0 border-t"
                        style={{
                          top:         (toMin(time) - GRID_START) * PX_PER_MIN,
                          borderColor: time.endsWith(':00') ? '#f3f4f6' : '#fafafa',
                        }}
                      />
                    ))}

                    {/* Empty-cell click targets between slots */}
                    {TIME_ROWS.map((time) => {
                      const tMin    = toMin(time);
                      const tMinEnd = tMin + STEP;
                      const occupied = daySlots.some(
                        (s) => toMin(s.startTime) < tMinEnd && toMin(s.endTime) > tMin,
                      );
                      if (occupied) return null;
                      return (
                        <div
                          key={time}
                          className="absolute inset-x-0"
                          style={{
                            top:    (tMin - GRID_START) * PX_PER_MIN,
                            height: STEP * PX_PER_MIN,
                          }}
                        >
                          <EmptyCell
                            day={d.value}
                            time={time}
                            onClick={openCreate}
                          />
                        </div>
                      );
                    })}

                    {/* Slot pills */}
                    {daySlots.map((slot) => (
                      <SlotPill
                        key={slot.id}
                        slot={slot}
                        onEdit={() => openEdit(slot)}
                        onDelete={() => {
                          if (confirm(`Remove ${slot.subject.name} on ${d.label} ${slot.startTime}?`)) {
                            deleteMutation.mutate(slot.id);
                          }
                        }}
                        deleting={deleteMutation.isPending}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Legend */}
      {timetable && timetable.slots.length > 0 && (
        <Card className="py-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Subjects</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Map(timetable.slots.map((s) => [s.subject.id, s.subject])).values()).map((subj) => {
              const c = pillColor(subj.id);
              return (
                <span
                  key={subj.id}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${c.bg} ${c.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                  {subj.name}
                </span>
              );
            })}
          </div>
        </Card>
      )}

      {/* Modal */}
      {modalOpen && (
        <TimetableSlotModal
          classId={selectedClassId}
          editSlot={editSlot}
          prefillDay={prefillDay}
          prefillStartTime={prefillTime}
          onClose={closeModal}
          onSuccess={closeModal}
        />
      )}
    </div>
  );
}
