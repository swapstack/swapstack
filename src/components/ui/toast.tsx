/* eslint-disable react-refresh/only-export-components */
import type { ViewProps } from 'react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { twMerge } from 'tailwind-merge';

import { Text } from './text';

export type ToastVariant = 'default' | 'success' | 'destructive' | 'warning' | 'info';

export type ToastProps = {
  message: string;
  description?: string;
  variant?: ToastVariant;
  onClose?: () => void;
  className?: string;
  testID?: string;
} & ViewProps;

const variantStyles: Record<ToastVariant, { container: string; message: string; description: string }> = {
  default: {
    container: 'bg-neutral-900 border-neutral-800 dark:bg-neutral-100 dark:border-neutral-200',
    message: 'text-white dark:text-neutral-900',
    description: 'text-neutral-300 dark:text-neutral-600',
  },
  success: {
    container: 'bg-success-600 border-success-700',
    message: 'text-white',
    description: 'text-success-100',
  },
  destructive: {
    container: 'bg-danger-600 border-danger-700',
    message: 'text-white',
    description: 'text-danger-100',
  },
  warning: {
    container: 'bg-warning-600 border-warning-700',
    message: 'text-white',
    description: 'text-warning-100',
  },
  info: {
    container: 'bg-neutral-800 border-neutral-700 dark:bg-neutral-200 dark:border-neutral-300',
    message: 'text-white dark:text-neutral-900',
    description: 'text-neutral-300 dark:text-neutral-600',
  },
};

export function Toast({
  message,
  description,
  variant = 'default',
  onClose,
  className = '',
  testID,
  style,
  ...props
}: ToastProps) {
  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <View
      testID={testID}
      className={twMerge(
        'mx-4 my-2 flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm',
        styles.container,
        className,
      )}
      style={style}
      {...props}
    >
      <View className="flex-1 pr-2">
        <Text
          testID={testID ? `${testID}-message` : undefined}
          className={twMerge('font-semibold text-sm', styles.message)}
        >
          {message}
        </Text>
        {description && (
          <Text
            testID={testID ? `${testID}-description` : undefined}
            className={twMerge('mt-0.5 font-sans text-xs', styles.description)}
          >
            {description}
          </Text>
        )}
      </View>
      {onClose && (
        <Pressable
          testID={testID ? `${testID}-close` : undefined}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close notification"
          className="p-1"
        >
          <Text className={twMerge('font-bold text-xs', styles.message)}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

export const toast = {
  show: (options: { message: string; description?: string; variant?: ToastVariant; duration?: number }) => {
    const flashType = options.variant === 'destructive'
      ? 'danger'
      : (options.variant || 'default');

    showMessage({
      message: options.message,
      description: options.description,
      type: flashType as any,
      duration: options.duration || 3000,
    });
  },
  success: (message: string, description?: string) => {
    toast.show({ message, description, variant: 'success' });
  },
  error: (message: string, description?: string) => {
    toast.show({ message, description, variant: 'destructive' });
  },
  warning: (message: string, description?: string) => {
    toast.show({ message, description, variant: 'warning' });
  },
  info: (message: string, description?: string) => {
    toast.show({ message, description, variant: 'info' });
  },
};

export const ToastContainer = FlashMessage;
