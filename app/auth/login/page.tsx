'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { FormInput } from '@/src/components/forms/FormInput';
import { Button } from '@/src/components/ui/Button';
import { useLoginMutation } from '@/src/hooks/queries/useAuth';
import { UserLoginInput, userLoginSchema } from '@/src/validators/userLoginSchema';
import { useAuthStore } from '@/src/stores/authStore';

const isDev = process.env.NODE_ENV === 'development';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const loginMutation = useLoginMutation(); 

  const { control, handleSubmit } = useForm<UserLoginInput>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      userCode: '',
      password: '',
    },
  });

  
  const onSubmit = async (data: UserLoginInput) => {
    await loginMutation.mutateAsync(data)
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">School Management</h1>
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

            {loginMutation.isError && (
              <p className="text-sm text-red-600 text-center">
                {(loginMutation.error as Error)?.message ?? 'Invalid credentials. Please try again.'}
              </p>
            )}

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

          {isDev && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-medium mb-2">Dev credentials</p>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded space-y-1">
                <p><strong>Super Admin:</strong> admin@school.com / password123</p>
                <p><strong>Student:</strong> STU-25/26-0001 / password123</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}