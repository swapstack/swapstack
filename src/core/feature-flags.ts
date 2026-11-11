import type { Unsubscribe } from './types';

export type FeatureFlagValue = boolean | string | number;

export type FeatureFlagsSnapshot = Record<string, FeatureFlagValue>;

export type FeatureFlagProvider = {
  readonly mode?: 'mock' | 'live';
  readonly isEnabled: (flagKey: string, defaultValue?: boolean) => Promise<boolean>;
  readonly getVariant: (flagKey: string, defaultValue?: string) => Promise<string>;
  readonly getAllFlags: () => Promise<FeatureFlagsSnapshot>;
  readonly setOverride: (flagKey: string, value: FeatureFlagValue) => Promise<void>;
  readonly refresh: () => Promise<FeatureFlagsSnapshot>;
  readonly onFlagsChange: (callback: (flags: FeatureFlagsSnapshot) => void) => Unsubscribe;
};
