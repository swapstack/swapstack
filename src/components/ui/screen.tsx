import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { twMerge } from 'tailwind-merge';

export type ScreenProps = {
  children?: React.ReactNode;
  className?: string;
  contentContainerClassName?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  edges?: readonly Edge[];
  keyboardOffset?: number;
  testID?: string;
} & ViewProps;

export function Screen({
  children,
  className = '',
  contentContainerClassName = '',
  style,
  contentContainerStyle,
  scrollable = false,
  edges = ['top', 'bottom', 'left', 'right'],
  keyboardOffset = 0,
  testID,
  ...props
}: ScreenProps) {
  const containerClasses = twMerge(
    'flex-1 bg-background',
    className,
  );

  return (
    <SafeAreaView
      edges={edges}
      testID={testID}
      className={containerClasses}
      style={style}
      {...props}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardOffset}
        className="flex-1"
      >
        {scrollable
          ? (
              <ScrollView
                className={twMerge('flex-1', contentContainerClassName)}
                contentContainerStyle={contentContainerStyle}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            )
          : (
              <View
                className={twMerge('flex-1', contentContainerClassName)}
                style={contentContainerStyle}
              >
                {children}
              </View>
            )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
