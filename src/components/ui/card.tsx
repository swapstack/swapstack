import type { TextProps, ViewProps } from 'react-native';
import * as React from 'react';
import { View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { Text } from './text';

type CardProps = {
  className?: string;
} & ViewProps;

export function Card({ className = '', style, children, testID, ...props }: CardProps) {
  return (
    <View
      testID={testID}
      className={twMerge(
        'rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900',
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ className = '', style, children, testID, ...props }: CardProps) {
  return (
    <View
      testID={testID}
      className={twMerge('flex flex-col space-y-1.5 pb-2', className)}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

type CardTextProps = {
  className?: string;
} & TextProps;

export function CardTitle({ className = '', children, testID, ...props }: CardTextProps) {
  return (
    <Text
      testID={testID}
      className={twMerge('text-lg font-semibold text-neutral-900 dark:text-neutral-50', className)}
      {...props}
    >
      {children}
    </Text>
  );
}

export function CardDescription({ className = '', children, testID, ...props }: CardTextProps) {
  return (
    <Text
      testID={testID}
      className={twMerge('text-sm text-neutral-500 dark:text-neutral-400', className)}
      {...props}
    >
      {children}
    </Text>
  );
}

export function CardContent({ className = '', style, children, testID, ...props }: CardProps) {
  return (
    <View
      testID={testID}
      className={twMerge('py-1', className)}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardFooter({ className = '', style, children, testID, ...props }: CardProps) {
  return (
    <View
      testID={testID}
      className={twMerge('flex flex-row items-center pt-2', className)}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
