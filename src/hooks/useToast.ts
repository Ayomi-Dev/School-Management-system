'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';

export const useToast = () => {
  const success = useCallback((message: string, duration = 4000) => {
    toast.success(message, { duration });
  }, []);

  const error = useCallback((message: string, duration = 5000) => {
    toast.error(message, { duration });
  }, []);

  const loading = useCallback((message: string) => {
    return toast.loading(message);
  }, []);

  const dismiss = useCallback((toastId: string) => {
    toast.dismiss(toastId);
  }, []);

  const promise = useCallback(
    (
      promise: Promise<unknown>,
      messages: { loading: string; success: string; error: string }
    ) => {
      return toast.promise(promise, messages);
    },
    []
  );

  return {
    success,
    error,
    loading,
    dismiss,
    promise,
  };
};
