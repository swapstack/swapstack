import type {
  ErrorBreadcrumb,
  ErrorReporterProvider,
  ErrorReportUser,
  ErrorSeverity,
} from '../error-reporter';

export type CapturedErrorReport = {
  readonly id: string;
  readonly type: 'exception' | 'message';
  readonly message: string;
  readonly severity: ErrorSeverity;
  readonly context?: Record<string, unknown>;
  readonly user: ErrorReportUser | null;
  readonly breadcrumbs: readonly ErrorBreadcrumb[];
};

export class MockErrorReporterProvider implements ErrorReporterProvider {
  public readonly mode = 'mock' as const;
  private reports: CapturedErrorReport[] = [];
  private breadcrumbs: ErrorBreadcrumb[] = [];
  private currentUser: ErrorReportUser | null = null;
  private counter = 0;

  public async captureException(
    error: unknown,
    context?: Record<string, unknown>,
  ): Promise<string> {
    this.counter += 1;
    const id = `err_${this.counter}`;
    const message = error instanceof Error ? error.message : String(error);
    this.reports.push({
      id,
      type: 'exception',
      message,
      severity: 'error',
      context,
      user: this.currentUser,
      breadcrumbs: [...this.breadcrumbs],
    });
    return id;
  }

  public async captureMessage(
    message: string,
    severity: ErrorSeverity = 'info',
  ): Promise<string> {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new Error('Error report message must not be empty.');
    }
    this.counter += 1;
    const id = `msg_${this.counter}`;
    this.reports.push({
      id,
      type: 'message',
      message: trimmed,
      severity,
      user: this.currentUser,
      breadcrumbs: [...this.breadcrumbs],
    });
    return id;
  }

  public async addBreadcrumb(breadcrumb: ErrorBreadcrumb): Promise<void> {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: breadcrumb.timestamp ?? new Date().toISOString(),
    });
  }

  public async setUser(user: ErrorReportUser | null): Promise<void> {
    this.currentUser = user ? { ...user } : null;
  }

  public getReports(): readonly CapturedErrorReport[] {
    return [...this.reports];
  }

  public getBreadcrumbs(): readonly ErrorBreadcrumb[] {
    return [...this.breadcrumbs];
  }

  public getCurrentUser(): ErrorReportUser | null {
    return this.currentUser;
  }

  public reset(): void {
    this.reports = [];
    this.breadcrumbs = [];
    this.currentUser = null;
    this.counter = 0;
  }
}
