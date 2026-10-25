import type { ViewProps } from 'react-native';
import * as React from 'react';
import { View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { Text } from './text';

export type DividerProps = {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
  labelClassName?: string;
} & ViewProps;

export function Divider({
  orientation = 'horizontal',
  label,
  className = '',
  labelClassName = '',
  testID,
  style,
  ...props
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <View
        testID={testID}
        className={twMerge('mx-2 h-full w-px bg-neutral-200 dark:bg-neutral-800', className)}
        style={style}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <View
        testID={testID}
        className={twMerge('my-4 flex flex-row items-center', className)}
        style={style}
        {...props}
      >
        <View className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        <Text
          testID={testID ? `${testID}-label` : undefined}
          className={twMerge(
            'px-3 text-xs font-medium text-neutral-400 uppercase dark:text-neutral-500',
            labelClassName,
          )}
        >
          {label}
        </Text>
        <View className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </View>
    );
  }

  return (
    <View
      testID={testID}
      className={twMerge('my-2 h-px w-full bg-neutral-200 dark:bg-neutral-800', className)}
      style={style}
      {...props}
    />
  );
}
