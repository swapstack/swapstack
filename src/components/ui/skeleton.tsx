import type { ViewProps } from 'react-native';
import * as React from 'react';
import { View } from 'react-native';
import { twMerge } from 'tailwind-merge';

export type SkeletonProps = {
  readonly className?: string;
} & ViewProps;

export function Skeleton({ className = '', testID, ...props }: SkeletonProps) {
  return (
    <View
      testID={testID}
      accessibilityLabel="Loading"
      accessibilityState={{ busy: true }}
      className={twMerge('h-4 w-full animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export type SkeletonListProps = {
  readonly rows?: number;
  readonly className?: string;
  readonly testID?: string;
};

export function SkeletonList({ rows = 3, className = '', testID }: SkeletonListProps) {
  const items = Array.from({ length: Math.max(1, rows) }, (_, i) => i);
  return (
    <View testID={testID} className={twMerge('gap-3', className)}>
      {items.map(i => (
        <View key={i} className="flex-row items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <View className="flex-1 gap-2">
            <Skeleton className="w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </View>
        </View>
      ))}
    </View>
  );
}
