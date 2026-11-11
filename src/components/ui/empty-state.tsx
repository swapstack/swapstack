import type { ReactNode } from 'react';
import * as React from 'react';
import { View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { Button } from './button';
import { Text } from './text';

export type EmptyStateProps = {
  readonly title: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly className?: string;
  readonly testID?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
  testID,
}: EmptyStateProps) {
  return (
    <View
      testID={testID}
      className={twMerge('items-center justify-center gap-2 rounded-xl border border-dashed border-border p-8', className)}
    >
      {icon ? <View className="mb-2">{icon}</View> : null}
      <Text className="text-center font-semibold text-lg text-foreground">{title}</Text>
      {description
        ? <Text className="text-center text-sm text-muted-foreground">{description}</Text>
        : null}
      {actionLabel && onAction
        ? (
            <View className="mt-2">
              <Button
                testID={testID ? `${testID}-action` : undefined}
                size="sm"
                label={actionLabel}
                onPress={onAction}
              />
            </View>
          )
        : null}
    </View>
  );
}
