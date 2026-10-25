import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export function Eye({ ...props }: SvgProps) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      {...props}
      className="stroke-neutral-500 dark:stroke-neutral-400"
    >
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
      />
      <Circle
        cx={12}
        cy={12}
        r={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </Svg>
  );
}
