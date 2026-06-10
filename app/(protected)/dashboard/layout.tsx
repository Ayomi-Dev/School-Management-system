'use client';

import { useProfileQuery } from '@/src/hooks/queries/useProfile';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useProfileQuery();
  return <>{children}</>;
}