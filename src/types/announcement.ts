export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  publishedAt: string | null;
  createdAt: string;
  author: { firstName: string | null; lastName: string | null };
}
