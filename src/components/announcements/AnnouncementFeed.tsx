'use client';

import { useState } from 'react';
import { Bell, CalendarDays, ChevronRight, X } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { useDashboardAnnouncements } from '@/src/hooks/queries/useAnnouncements';
import type { AnnouncementItem } from '@/src/types/announcement';

function formatDate(value: string | null) {
  if (!value) return 'Just published';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function AnnouncementFeed() {
  const { data = [], isLoading, isError } = useDashboardAnnouncements();
  const [selected, setSelected] = useState<AnnouncementItem | null>(null);
  if(!data) return null
  console.log('AnnouncementFeed data:', data);

  return (
    <>
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900"><Bell size={18} className="text-blue-600" />School Announcements</h2>
          {data?.length > 0 && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{data.length} recent</span>}
        </div>
        {isLoading ? <p className="px-5 py-6 text-sm text-gray-500">Loading announcements…</p> : isError ? (
          <p className="px-5 py-6 text-sm text-red-600">Could not load announcements.</p>
        ) : data.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500">There are no announcements yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.map((item) => <button key={item.id} type="button" onClick={() => setSelected(item)} className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700"><Bell size={17} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-900">{item.title}</span>
                <span className="mt-0.5 block truncate text-xs text-gray-500">{item.body}</span>
                <span className="mt-1 block text-[11px] text-gray-400">{formatDate(item.publishedAt)}</span>
              </span>
              <ChevronRight size={17} className="shrink-0 text-gray-400" />
            </button>)}
          </div>
        )}
      </Card>

      {selected && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }} className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-4">
        <section role="dialog" aria-modal="true" aria-labelledby="announcement-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
            <div><p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700"><Bell size={13} />School announcement</p><h2 id="announcement-title" className="text-xl font-bold text-gray-900">{selected.title}</h2></div>
            <button type="button" aria-label="Close announcement" onClick={() => setSelected(null)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={18} /></button>
          </div>
          <div className="px-6 py-5">
            <p className="mb-4 flex items-center gap-2 text-xs text-gray-400"><CalendarDays size={14} />{formatDate(selected.publishedAt)} · {[selected.author.firstName, selected.author.lastName].filter(Boolean).join(' ') || 'School admin'}</p>
            <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">{selected.body}</div>
          </div>
          <div className="flex justify-end border-t border-gray-100 px-6 py-4"><button type="button" onClick={() => setSelected(null)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Close</button></div>
        </section>
      </div>}
    </>
  );
}
