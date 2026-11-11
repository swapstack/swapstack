import type { ViewProps } from 'react-native';
import * as React from 'react';
import { View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { Text } from './text';

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'destructive';

export type BadgeProps = {
  readonly label: string;
  readonly variant?: BadgeVariant;
  readonly className?: string;
} & ViewProps;

const CONTAINER_VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-foreground border-foreground',
  secondary: 'bg-muted border-muted',
  outline: 'bg-transparent border-border',
  success: 'bg-emerald-600 border-emerald-600',
  destructive: 'bg-destructive border-destructive',
};

const LABEL_VARIANTS: Record<BadgeVariant, string> = {
  default: 'text-background',
  secondary: 'text-foreground',
  outline: 'text-foreground',
  success: 'text-white',
  destructive: 'text-destructive-foreground',
};

export function Badge({ label, variant = 'default', className = '', testID, ...props }: BadgeProps) {
  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={label}
      className={twMerge(
        'flex-row items-center self-start rounded-full border px-2.5 py-0.5',
        CONTAINER_VARIANTS[variant],
        className,
      )}
      {...props}
    >
      <Text
        testID={testID ? `${testID}-label` : undefined}
        className={twMerge('font-semibold text-xs', LABEL_VARIANTS[variant])}
      >
        {label}
      </Text>
    </View>
  );
}
