export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export type ErrorBreadcrumb = {
  readonly category: string;
  readonly message: string;
  readonly level?: ErrorSeverity;
  readonly data?: Record<string, string | number | boolean | null>;
  readonly timestamp?: string;
};

export type ErrorReportUser = {
  readonly id: string;
  readonly email?: string | null;
};

export type ErrorReporterProvider = {
  readonly mode?: 'live' | 'mock';
  readonly captureException: (
    error: unknown,
    context?: Record<string, unknown>,
  ) => Promise<string>;
  readonly captureMessage: (
    message: string,
    severity?: ErrorSeverity,
  ) => Promise<string>;
  readonly addBreadcrumb: (breadcrumb: ErrorBreadcrumb) => Promise<void>;
  readonly setUser: (user: ErrorReportUser | null) => Promise<void>;
};
