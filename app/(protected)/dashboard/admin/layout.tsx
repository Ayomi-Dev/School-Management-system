import { AdminDashboardLayout } from '@/src/components/layouts';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
}
