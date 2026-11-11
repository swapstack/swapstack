import type { ReactNode } from 'react';
import * as React from 'react';
import { Pressable, Modal as RNModal, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { Text } from './text';

export type SheetProps = {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly children?: ReactNode;
  readonly className?: string;
  readonly testID?: string;
};

/**
 * Lightweight bottom sheet built on React Native's `Modal`.
 * Use this for simple confirmations and pickers; use `Modal` (gorhom bottom sheet)
 * when you need snap points or gesture-driven sheets.
 */
export function Sheet({ visible, onClose, title, children, className = '', testID }: SheetProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          testID={testID ? `${testID}-backdrop` : undefined}
          accessibilityLabel="Close sheet"
          onPress={onClose}
          className="absolute inset-0 bg-black/40"
        />
        <View
          testID={testID}
          className={twMerge('rounded-t-3xl border border-border bg-card px-6 pt-3 pb-10', className)}
        >
          <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-muted" />
          {title
            ? <Text className="mb-3 font-semibold text-lg text-card-foreground">{title}</Text>
            : null}
          {children}
        </View>
      </View>
    </RNModal>
  );
}
