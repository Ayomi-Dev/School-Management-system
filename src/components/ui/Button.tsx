'use client';

import React from 'react';
import { ButtonProps } from '@/src/types/ui';
import { clsx } from 'clsx';

const variantStyles = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400',
  secondary:
    'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100',
  outline:
    'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:border-gray-200',
  ghost: 'text-gray-700 hover:bg-gray-100 disabled:text-gray-400',
  destructive:
    'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded',
  md: 'px-4 py-2 text-base rounded-md',
  lg: 'px-6 py-3 text-lg rounded-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'font-medium transition-colors duration-200 flex items-center justify-center gap-2',
          'disabled:cursor-not-allowed cursor-pointer',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
