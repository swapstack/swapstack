import { describeErrorReporterProviderContract } from '@/core/contracts';
import { createSentryErrorReporterProvider } from '../error-reporter-provider';

describeErrorReporterProviderContract('SentryErrorReporterProvider', () =>
  createSentryErrorReporterProvider({ dsn: 'https://public@sentry.example.com/1' }));

describe('sentryErrorReporterProvider configuration', () => {
  it('throws when EXPO_PUBLIC_SENTRY_DSN is missing and no client is injected', () => {
    const prev = process.env.EXPO_PUBLIC_SENTRY_DSN;
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    expect(() => createSentryErrorReporterProvider()).toThrow(/Missing EXPO_PUBLIC_SENTRY_DSN/);
    if (prev !== undefined) {
      process.env.EXPO_PUBLIC_SENTRY_DSN = prev;
    }
  });
});
