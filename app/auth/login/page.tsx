'use client';

import { Suspense, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormInput } from '@/src/components/forms/FormInput';
import { Button } from '@/src/components/ui/Button';
import { useLoginMutation } from '@/src/hooks/queries/useAuth';
import { UserLoginInput, userLoginSchema } from '@/src/validators/userLoginSchema';
import { useAuthStore } from '@/src/stores/authStore';

const roles = ["admin", "student", "teacher", "parent", "bursar"];

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams().get("role") as string;
  const capsParams = searchParams
    ? searchParams.charAt(0).toUpperCase() + searchParams.slice(1)
    : '';
  const isParamsTrue = roles.includes(searchParams);
  const router = useRouter();
  const { user, error: authError, setError: setAuthError } = useAuthStore();
  const { handleLogin, loginMutation } = useLoginMutation();

  const { control, handleSubmit } = useForm<UserLoginInput>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      userCode: '',
      password: '',
    },
  });

  const onSubmit = async (data: UserLoginInput) => {
    setAuthError(null);
    await handleLogin(data);
  };

  useEffect(() => {
    if (user) {
      router.replace(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isParamsTrue ? `Welcome ${capsParams}` : "School Portal"}
            </h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormInput
              control={control}
              name="userCode"
              label="User Code / Email"
              placeholder="e.g. STU-25/26-0001 or admin@school.com"
              required
            />

            <FormInput
              control={control}
              name="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              required
            />

            <div className="flex justify-end">
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loginMutation.isPending}
            >
              Sign In
            </Button>
          </form>

          {authError && (
            <div className="mt-4 text-red-600 text-sm text-center">
              {authError}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
          </div>
          <div className="space-y-6">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}