export type AnalyticsEvent = {
  readonly name: string;
  readonly properties?: Record<string, unknown>;
  readonly userId?: string | null;
  readonly timestamp: string;
};

export type AnalyticsProvider = {
  readonly mode?: 'mock' | 'live';
  readonly isEnabled: () => boolean;
  readonly setEnabled: (enabled: boolean) => void;
  readonly identify: (userId: string, traits?: Record<string, unknown>) => Promise<void>;
  readonly track: (eventName: string, properties?: Record<string, unknown>) => Promise<void>;
  readonly captureError: (error: unknown, context?: Record<string, unknown>) => Promise<void>;
  readonly reset: () => Promise<void>;
};
