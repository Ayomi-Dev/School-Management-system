// app/auth/refresh-session/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/src/services/client/auth';
import { useAuthStore } from '@/src/stores/authStore';

const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  SUPER_ADMIN: '/dashboard/super-admin',
  ADMIN:       '/dashboard/admin',
  TEACHER:     '/dashboard/teacher',
  STUDENT:     '/dashboard/student',
  PARENT:      '/dashboard/parent',
  BURSAR:      '/dashboard/bursar',
};

export default function RefreshSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  useEffect(() => {
    // Where to go after successful refresh:
    // 1. Use callbackUrl if provided (exact page they were trying to reach)
    // 2. Fall back to role-based default route
    // 3. Fall back to /auth/login if neither is available
    const callbackUrl = searchParams.get('callbackUrl');
    const roleRoute = user?.role ? ROLE_DEFAULT_ROUTES[user.role] : null;
    const destination = callbackUrl ?? roleRoute ?? '/auth/login';

    authService
      .refresh()
      .then(() => router.replace(`${destination}`))
      .catch(() => router.replace('/auth/login'));
    }, [router, searchParams, user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-sm">Resuming your session...</p>
    </div>
  );
}