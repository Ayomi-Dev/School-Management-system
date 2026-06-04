// app/auth/refresh-session/page.tsx
'use client';

import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    setLoading(true);
    
    // 2.
    
    const callbackUrl = searchParams.get('callbackUrl'); //  Use callbackUrl if provided (exact page they were trying to reach)
    const roleRoute = user?.role ? ROLE_DEFAULT_ROUTES[user.role] : null; // Fall back to role-based default route
    const destination = callbackUrl ?? roleRoute ?? '/auth/login'; //Fall back to /auth/login if neither is available

    authService
      .refresh()
      .then(() => {
        setLoading(false);
        router.replace(`${destination}`)})
      .catch(() => {
        setLoading(false);
        router.replace('/auth/login');
      });
    }, [router, searchParams, user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {loading ? (<p className="text-gray-500 text-sm">Resuming your session...</p>) 
      : 
      (<p className="text-gray-500 text-sm">Redirecting to login page...</p>)
    }
    </div>
  );
}