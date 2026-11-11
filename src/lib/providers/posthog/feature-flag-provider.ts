import type {
  FeatureFlagProvider,
  FeatureFlagsSnapshot,
  FeatureFlagValue,
} from '@/core/feature-flags';
import type { Unsubscribe } from '@/core/types';

export type PostHogFeatureFlagsClient = {
  readonly fetchFlags: () => Promise<FeatureFlagsSnapshot>;
};

export type PostHogFeatureFlagConfig = {
  readonly apiKey?: string;
  readonly host?: string;
  readonly client?: PostHogFeatureFlagsClient;
};

function createHttpPostHogFlagsClient(
  _apiKey: string,
  _host: string,
): PostHogFeatureFlagsClient {
  return {
    async fetchFlags() {
      return {};
    },
  };
}

export class PostHogFeatureFlagProvider implements FeatureFlagProvider {
  public readonly mode = 'live' as const;
  private readonly client: PostHogFeatureFlagsClient;
  private remoteFlags: FeatureFlagsSnapshot = {};
  private overrides: Record<string, FeatureFlagValue> = {};
  private readonly listeners = new Set<(flags: FeatureFlagsSnapshot) => void>();

  public constructor(config: PostHogFeatureFlagConfig = {}) {
    if (config.client) {
      this.client = config.client;
      return;
    }

    const apiKey = (config.apiKey ?? process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '').trim();
    if (!apiKey) {
      throw new Error('Missing EXPO_PUBLIC_POSTHOG_API_KEY for PostHog feature flags.');
    }

    const host = (
      config.host
      ?? process.env.EXPO_PUBLIC_POSTHOG_HOST
      ?? 'https://us.i.posthog.com'
    ).trim();

    this.client = createHttpPostHogFlagsClient(apiKey, host);
  }

  public async isEnabled(flagKey: string, defaultValue = false): Promise<boolean> {
    const snapshot = await this.getAllFlags();
    const val = snapshot[flagKey];
    if (typeof val === 'boolean') {
      return val;
    }
    return defaultValue;
  }

  public async getVariant(flagKey: string, defaultValue = 'control'): Promise<string> {
    const snapshot = await this.getAllFlags();
    const val = snapshot[flagKey];
    if (typeof val === 'string') {
      return val;
    }
    return defaultValue;
  }

  public async getAllFlags(): Promise<FeatureFlagsSnapshot> {
    return {
      ...this.remoteFlags,
      ...this.overrides,
    };
  }

  public async setOverride(flagKey: string, value: FeatureFlagValue): Promise<void> {
    this.overrides[flagKey] = value;
    const next = await this.getAllFlags();
    for (const listener of this.listeners) {
      listener(next);
    }
  }

  public async refresh(): Promise<FeatureFlagsSnapshot> {
    this.remoteFlags = await this.client.fetchFlags();
    const next = await this.getAllFlags();
    for (const listener of this.listeners) {
      listener(next);
    }
    return next;
  }

  public onFlagsChange(callback: (flags: FeatureFlagsSnapshot) => void): Unsubscribe {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

export function createPostHogFeatureFlagProvider(
  config?: PostHogFeatureFlagConfig,
): PostHogFeatureFlagProvider {
  return new PostHogFeatureFlagProvider(config);
}
