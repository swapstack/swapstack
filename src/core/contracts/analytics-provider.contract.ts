import type { AnalyticsProvider } from '../analytics';

export function describeAnalyticsProviderContract(
  createProvider: () => Promise<AnalyticsProvider> | AnalyticsProvider,
) {
  describe('analytics provider contract', () => {
    let analytics: AnalyticsProvider;

    beforeEach(async () => {
      analytics = await createProvider();
    });

    it('toggles enabled state and tracks events and errors without throwing', async () => {
      expect(analytics.isEnabled()).toBe(true);

      await analytics.identify('user_123', { plan: 'pro' });
      await analytics.track('paywall_viewed', { source: 'home' });
      await analytics.captureError(new Error('Network timeout'), { screen: 'paywall' });

      analytics.setEnabled(false);
      expect(analytics.isEnabled()).toBe(false);

      await analytics.track('ignored_event');
      await analytics.reset();
    });
  });
}
