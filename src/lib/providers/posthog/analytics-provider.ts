import type { AnalyticsProvider } from '@/core/analytics';

export type PostHogClient = {
  readonly identify: (userId: string, properties?: Record<string, unknown>) => Promise<void>;
  readonly capture: (eventName: string, properties?: Record<string, unknown>) => Promise<void>;
  readonly reset: () => Promise<void>;
};

export type PostHogAnalyticsOptions = {
  readonly apiKey?: string;
  readonly host?: string;
  readonly client?: PostHogClient;
};

export function createDefaultPostHogClient(options: PostHogAnalyticsOptions = {}): PostHogClient {
  const apiKey = (options.apiKey ?? process.env.EXPO_PUBLIC_POSTHOG_API_KEY)?.trim();
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_POSTHOG_API_KEY.');
  }

  return {
    identify: async () => {},
    capture: async () => {},
    reset: async () => {},
  };
}

export class PostHogAnalyticsProvider implements AnalyticsProvider {
  readonly mode = 'live' as const;
  private enabled = true;
  private readonly client: PostHogClient;

  constructor(options: PostHogAnalyticsOptions = {}) {
    this.client = options.client ?? createDefaultPostHogClient(options);
  }

  isEnabled = (): boolean => {
    return this.enabled;
  };

  setEnabled = (enabled: boolean): void => {
    this.enabled = enabled;
  };

  identify = async (userId: string, traits?: Record<string, unknown>): Promise<void> => {
    if (!this.enabled) {
      return;
    }
    await this.client.identify(userId, traits);
  };

  track = async (eventName: string, properties?: Record<string, unknown>): Promise<void> => {
    if (!this.enabled) {
      return;
    }
    await this.client.capture(eventName, properties);
  };

  captureError = async (error: unknown, context?: Record<string, unknown>): Promise<void> => {
    if (!this.enabled) {
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    await this.client.capture('$exception', {
      ...context,
      message,
    });
  };

  reset = async (): Promise<void> => {
    await this.client.reset();
  };
}

export function createPostHogAnalyticsProvider(
  options: PostHogAnalyticsOptions = {},
): PostHogAnalyticsProvider {
  return new PostHogAnalyticsProvider(options);
}
