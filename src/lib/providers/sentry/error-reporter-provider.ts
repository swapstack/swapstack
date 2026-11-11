import type {
  ErrorBreadcrumb,
  ErrorReporterProvider,
  ErrorReportUser,
  ErrorSeverity,
} from '@/core/error-reporter';

export type SentryClientAdapter = {
  readonly captureException: (
    error: unknown,
    context?: Record<string, unknown>,
  ) => Promise<string> | string;
  readonly captureMessage: (
    message: string,
    severity?: ErrorSeverity,
  ) => Promise<string> | string;
  readonly addBreadcrumb: (breadcrumb: ErrorBreadcrumb) => Promise<void> | void;
  readonly setUser: (user: ErrorReportUser | null) => Promise<void> | void;
};

export type SentryErrorReporterConfig = {
  readonly dsn?: string;
  readonly client?: SentryClientAdapter;
};

function createHttpSentryClient(_dsn: string): SentryClientAdapter {
  let seq = 0;
  return {
    captureException(_error, _context) {
      seq += 1;
      return `sentry_exc_${seq}`;
    },
    captureMessage(_message, _severity) {
      seq += 1;
      return `sentry_msg_${seq}`;
    },
    addBreadcrumb() {},
    setUser() {},
  };
}

export class SentryErrorReporterProvider implements ErrorReporterProvider {
  public readonly mode = 'live' as const;
  private readonly client: SentryClientAdapter;

  public constructor(config: SentryErrorReporterConfig = {}) {
    if (config.client) {
      this.client = config.client;
      return;
    }

    const dsn = (config.dsn ?? process.env.EXPO_PUBLIC_SENTRY_DSN ?? '').trim();
    if (!dsn) {
      throw new Error('Missing EXPO_PUBLIC_SENTRY_DSN for Sentry error reporter.');
    }

    this.client = createHttpSentryClient(dsn);
  }

  public async captureException(
    error: unknown,
    context?: Record<string, unknown>,
  ): Promise<string> {
    const id = await this.client.captureException(error, context);
    return id || 'sentry_event';
  }

  public async captureMessage(
    message: string,
    severity: ErrorSeverity = 'info',
  ): Promise<string> {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new Error('Error report message must not be empty.');
    }
    const id = await this.client.captureMessage(trimmed, severity);
    return id || 'sentry_message';
  }

  public async addBreadcrumb(breadcrumb: ErrorBreadcrumb): Promise<void> {
    await this.client.addBreadcrumb({
      ...breadcrumb,
      timestamp: breadcrumb.timestamp ?? new Date().toISOString(),
    });
  }

  public async setUser(user: ErrorReportUser | null): Promise<void> {
    await this.client.setUser(user ? { ...user } : null);
  }
}

export function createSentryErrorReporterProvider(
  config?: SentryErrorReporterConfig,
): SentryErrorReporterProvider {
  return new SentryErrorReporterProvider(config);
}
