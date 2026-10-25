import type { ViewProps } from 'react-native';
import * as React from 'react';
import { View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { Image } from './image';
import { Text } from './text';

const sizeMap = {
  sm: {
    container: 'size-8',
    text: 'text-xs',
  },
  md: {
    container: 'size-10',
    text: 'text-sm',
  },
  lg: {
    container: 'size-12',
    text: 'text-base',
  },
  xl: {
    container: 'size-16',
    text: 'text-xl',
  },
};

export type AvatarProps = {
  src?: string;
  initials?: string;
  size?: keyof typeof sizeMap;
  className?: string;
} & ViewProps;

export function Avatar({
  src,
  initials,
  size = 'md',
  className = '',
  testID,
  style,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const sizeConfig = sizeMap[size] || sizeMap.md;

  const showImage = Boolean(src) && !imageError;

  return (
    <View
      testID={testID}
      className={twMerge(
        'items-center justify-center overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800',
        sizeConfig.container,
        className,
      )}
      style={style}
      {...props}
    >
      {showImage
        ? (
            <Image
              testID={testID ? `${testID}-image` : undefined}
              source={{ uri: src }}
              className="size-full"
              onError={() => setImageError(true)}
            />
          )
        : (
            <Text
              testID={testID ? `${testID}-initials` : undefined}
              className={twMerge('font-semibold text-neutral-700 uppercase dark:text-neutral-200', sizeConfig.text)}
            >
              {initials || ''}
            </Text>
          )}
    </View>
  );
}
