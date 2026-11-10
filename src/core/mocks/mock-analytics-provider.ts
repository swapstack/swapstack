import type { AnalyticsEvent, AnalyticsProvider } from '../analytics';

export type CapturedErrorRecord = {
  readonly message: string;
  readonly context?: Record<string, unknown>;
  readonly timestamp: string;
};

export class MockAnalyticsProvider implements AnalyticsProvider {
  readonly mode = 'mock' as const;
  private enabled = true;
  private currentUserId: string | null = null;
  private userTraits: Record<string, unknown> = {};
  private events: AnalyticsEvent[] = [];
  private errors: CapturedErrorRecord[] = [];

  readonly isEnabled = (): boolean => {
    return this.enabled;
  };

  readonly setEnabled = (enabled: boolean): void => {
    this.enabled = enabled;
  };

  readonly identify = async (
    userId: string,
    traits?: Record<string, unknown>,
  ): Promise<void> => {
    if (!this.enabled) {
      return;
    }
    this.currentUserId = userId;
    this.userTraits = traits ? structuredClone(traits) : {};
  };

  readonly track = async (
    eventName: string,
    properties?: Record<string, unknown>,
  ): Promise<void> => {
    if (!this.enabled) {
      return;
    }
    const event: AnalyticsEvent = {
      name: eventName,
      properties: properties ? structuredClone(properties) : undefined,
      userId: this.currentUserId,
      timestamp: new Date().toISOString(),
    };
    this.events.push(event);
  };

  readonly captureError = async (
    error: unknown,
    context?: Record<string, unknown>,
  ): Promise<void> => {
    if (!this.enabled) {
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    this.errors.push({
      message,
      context: context ? structuredClone(context) : undefined,
      timestamp: new Date().toISOString(),
    });
  };

  readonly reset = async (): Promise<void> => {
    this.currentUserId = null;
    this.userTraits = {};
    this.events = [];
    this.errors = [];
  };

  readonly getTrackedEvents = (): AnalyticsEvent[] => {
    return this.events.map(e => structuredClone(e));
  };

  readonly getCapturedErrors = (): CapturedErrorRecord[] => {
    return this.errors.map(e => structuredClone(e));
  };

  readonly getCurrentUserId = (): string | null => {
    return this.currentUserId;
  };

  readonly getUserTraits = (): Record<string, unknown> => {
    return structuredClone(this.userTraits);
  };
}
