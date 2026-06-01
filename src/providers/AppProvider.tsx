'use client';

import React, { ReactNode, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from './QueryProvider';
import { useUIStore } from '@/src/stores/uiStore';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    // Applies theme on mount
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryProvider>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 5000,
          style: {
            background: '#fff',
            color: '#000',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          success: {
            duration: 4000,
            style: {
              background: '#ecfdf5',
              color: '#065f46',
              borderLeft: '4px solid #10b981',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#ecfdf5',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#fef2f2',
              color: '#7f1d1d',
              borderLeft: '4px solid #ef4444',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fef2f2',
            },
          },
        }}
      />
      {children}
    </QueryProvider>
  );
};
