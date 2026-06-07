import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAccessToken } from '@/src/lib/auth/session';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value as string;

  // If no token at all then straight to login
  if (!accessToken) {
    redirect('/auth/refresh');
  }

  try {
    // Valid token → render children normally
    await verifyAccessToken(accessToken);
    return <>{children}</>;
  } catch {
    // Token exists but is expired → give the client a chance to refresh
    // instead of immediately kicking to login
    redirect('/auth/login');
  }
}