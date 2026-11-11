import type { ErrorReporterProvider } from '../error-reporter';

export function describeErrorReporterProviderContract(
  label: string,
  createProvider: () => ErrorReporterProvider | Promise<ErrorReporterProvider>,
): void {
  describe(`ErrorReporterProvider contract (${label})`, () => {
    it('captures exceptions and returns an event identifier', async () => {
      const provider = await createProvider();
      const eventId = await provider.captureException(new Error('Network timeout'), {
        route: '/paywall',
      });
      expect(typeof eventId).toBe('string');
      expect(eventId.length).toBeGreaterThan(0);
    });

    it('captures messages with severity levels and rejects blank messages', async () => {
      const provider = await createProvider();
      const eventId = await provider.captureMessage('Rate limit approaching', 'warning');
      expect(typeof eventId).toBe('string');
      expect(eventId.length).toBeGreaterThan(0);
      await expect(provider.captureMessage('   ')).rejects.toThrow();
    });

    it('records breadcrumbs and user context without throwing', async () => {
      const provider = await createProvider();
      await provider.setUser({ id: 'usr_123', email: 'dev@example.com' });
      await provider.addBreadcrumb({
        category: 'navigation',
        message: 'Opened settings screen',
        level: 'info',
      });
      const eventId = await provider.captureException(new Error('Test failure'));
      expect(eventId.length).toBeGreaterThan(0);
      await provider.setUser(null);
    });
  });
}
