// app/auth/refresh-session/page.tsx
'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  return (
    <Suspense fallback={<RefreshSessionFallback />}>
      <RefreshSession />
    </Suspense>
  );
}

function RefreshSession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setLoading, isLoading, setError, error: authError } = useAuthStore();
  const refreshMutation = useRefreshAuthMutation();

  const handleRefresh = async () => {
    return await refreshMutation.mutateAsync();
  };

  useEffect(() => {
    const callbackUrl = searchParams.get('callbackUrl');

    setLoading(true);
    handleRefresh()
      .then((freshUser) => {
        // read the resolved value from the mutation, not the stale `user` from closure
        const roleRoute = freshUser?.user?.role ? ROLE_DEFAULT_ROUTES[freshUser?.user?.role] : null;
        const destination = callbackUrl ?? roleRoute ?? '/auth/login';
        console.log(destination);
        router.replace(destination);
      })
      .catch(() => {
        console.log("refresh failed");
        setError("Session expired. Relogin to continue");
        router.push('/auth/login');
      })
      .finally(() => setLoading(false));
  }, []); // ← empty deps, run once on mount only

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

function RefreshSessionFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader />
    </div>
  );
}