import type {
  FeatureFlagProvider,
  FeatureFlagsSnapshot,
  FeatureFlagValue,
} from '../feature-flags';
import type { Unsubscribe } from '../types';

export const DEFAULT_MOCK_FEATURE_FLAGS: FeatureFlagsSnapshot = {
  new_paywall_layout: true,
  onboarding_v2: false,
  ai_assistant_beta: true,
  checkout_variant: 'control',
};

export class MockFeatureFlagProvider implements FeatureFlagProvider {
  readonly mode = 'mock' as const;
  private flags: FeatureFlagsSnapshot = { ...DEFAULT_MOCK_FEATURE_FLAGS };
  private readonly listeners = new Set<(flags: FeatureFlagsSnapshot) => void>();

  isEnabled = async (flagKey: string, defaultValue = false): Promise<boolean> => {
    const val = this.flags[flagKey];
    if (typeof val === 'boolean') {
      return val;
    }
    return defaultValue;
  };

  getVariant = async (flagKey: string, defaultValue = 'control'): Promise<string> => {
    const val = this.flags[flagKey];
    if (typeof val === 'string') {
      return val;
    }
    return defaultValue;
  };

  getAllFlags = async (): Promise<FeatureFlagsSnapshot> => {
    return { ...this.flags };
  };

  setOverride = async (flagKey: string, value: FeatureFlagValue): Promise<void> => {
    this.flags = {
      ...this.flags,
      [flagKey]: value,
    };
    const snapshot = { ...this.flags };
    this.listeners.forEach((cb) => {
      cb(snapshot);
    });
  };

  refresh = async (): Promise<FeatureFlagsSnapshot> => {
    return { ...this.flags };
  };

  onFlagsChange = (callback: (flags: FeatureFlagsSnapshot) => void): Unsubscribe => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  reset(): void {
    this.flags = { ...DEFAULT_MOCK_FEATURE_FLAGS };
    this.listeners.clear();
  }
}
