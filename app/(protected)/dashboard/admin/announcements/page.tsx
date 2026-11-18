'use client';

import { FormEvent, useState } from 'react';
import { Bell, Megaphone, Send } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';
import { useAdminAnnouncements, useCreateAnnouncement } from '@/src/hooks/queries/useAnnouncements';

export default function AdminAnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [formError, setFormError] = useState('');
  const { data: announcements = [], isLoading, isError } = useAdminAnnouncements();
  const createMutation = useCreateAnnouncement();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    if (title.trim().length < 3) return setFormError('Enter a title with at least 3 characters.');
    if (!body.trim()) return setFormError('Enter the announcement or newsletter content.');
    createMutation.mutate({ title: title.trim(), body: body.trim() }, {
      onSuccess: () => { setTitle(''); setBody(''); },
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header><h1 className="text-2xl font-bold text-gray-900">Newsletters & Announcements</h1><p className="mt-1 text-sm text-gray-500">Publish a school update to student and teacher dashboards.</p></header>

      <Card className="p-6">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900"><Megaphone size={19} className="text-blue-600" />Compose an update</h2>
        <form onSubmit={submit} className="space-y-4">
          <div><label htmlFor="announcement-title" className="mb-1.5 block text-sm font-medium text-gray-700">Title</label><input id="announcement-title" maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="For example: End of term newsletter" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div>
          <div><label htmlFor="announcement-body" className="mb-1.5 block text-sm font-medium text-gray-700">Message</label><textarea id="announcement-body" maxLength={12000} rows={7} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write the update for students and teachers…" className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><p className="mt-1 text-right text-xs text-gray-400">{body.length}/12000</p></div>
          {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-gray-500">Publishing makes this update immediately visible to students and teachers.</p><Button type="submit" variant="primary" disabled={createMutation.isPending} className="flex items-center gap-2"><Send size={15} />{createMutation.isPending ? 'Publishing…' : 'Publish update'}</Button></div>
        </form>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Published updates</h2>
        {isLoading ? 
          <div className="flex justify-center py-10"><Loader /></div>
           : 
          isError ? 
          <Card>
          <p className="py-6 text-center text-sm text-red-600">
            Could not load published updates.
          </p>
          </Card> : 
            announcements?.length === 0 
            ? 
          <Card>
            <p className="py-6 text-center text-sm text-gray-500">
              No announcements have been published yet.
            </p>
          </Card> : 
          announcements?.map((item) => <Card key={item.id} className="p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <Bell size={16} /></span><div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <span className="text-xs text-gray-400">
                      {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'Not published'}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{item.body}</p>
                  <p className="mt-3 text-xs text-gray-400">Published by {item.author.firstName} {item.author.lastName}</p>
                </div>
            </div>
          </Card>)}
      </section>
    </div>
  );
}
