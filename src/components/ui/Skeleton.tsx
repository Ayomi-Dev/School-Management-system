'use client';

import React from 'react';
import { SkeletonProps } from '@/src/types/ui';
import { clsx } from 'clsx';

export const Skeleton: React.FC<SkeletonProps> = ({
  count = 1,
  height = 20,
  width = '100%',
  circle = false,
  className,
}) => {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={clsx(
        'bg-gray-200 animate-pulse',
        circle ? 'rounded-full' : 'rounded',
        className
      )}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
      }}
    />
  ));

  return <>{skeletons}</>;
};

Skeleton.displayName = 'Skeleton';
