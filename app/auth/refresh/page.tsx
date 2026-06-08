// app/auth/refresh-session/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/src/services/client/auth';
import { useAuthStore } from '@/src/stores/authStore';
import { Loader } from '@/src/components/ui/Loader';
import { useRefreshAuthMutation } from '@/src/hooks/queries/useAuth';

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
  const { user, isLoading, error: authError } = useAuthStore();
  const refreshMutation = useRefreshAuthMutation(); // Directly use the service method since we're handling state manually here
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async() => {
    await refreshMutation.mutateAsync()
  }


  useEffect(() => {    
    const callbackUrl = searchParams.get('callbackUrl'); //  Use callbackUrl if provided (exact page they were trying to reach)
    const roleRoute = user?.role ? ROLE_DEFAULT_ROUTES[user.role] : null; // Fall back to role-based default route
    const destination = callbackUrl ?? roleRoute ?? '/auth/login' //Fall back to /auth/login if neither is available

    handleRefresh()
    .then(() => {
        router.replace(`${destination}`);
    })
    .catch(() => {
      router.push('/auth/login');
    })
    // authService
    // .refresh()
    // .then(() => {
    //   return;
    // })
    // .catch(() => {
    //   setError("Session refresh failed. Please log in again.");
    //   setTimeout(() => {
    //     setLoading(false);
    //   }, 1500)
    // })
    // .finally(() => {
    //     setLoading(false);
    // });
    }, [searchParams, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {isLoading && <Loader />}
      {authError && <p className="text-red-500">{authError}</p>}
      {!isLoading && !authError && (
        <p className="text-gray-500 text-sm">Your session is being refreshed...</p>
      )}
    </div>
  );
}