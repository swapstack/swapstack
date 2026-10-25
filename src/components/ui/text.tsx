/* eslint-disable better-tailwindcss/no-unknown-classes */
import type { TextProps, TextStyle } from 'react-native';
import * as React from 'react';
import { I18nManager, Text as NNText, StyleSheet } from 'react-native';
import { twMerge } from 'tailwind-merge';

type Props = {
  className?: string;
} & TextProps;

export function Text({ className = '', style, children, ...props }: Props) {
  const textStyle = React.useMemo(
    () =>
      twMerge(
        'font-inter text-base font-normal text-black dark:text-white',
        className,
      ),
    [className],
  );

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        style,
      ]) as TextStyle,
    [style],
  );
  return (
    <NNText className={textStyle} style={nStyle} {...props}>
      {children}
    </NNText>
  );
}
