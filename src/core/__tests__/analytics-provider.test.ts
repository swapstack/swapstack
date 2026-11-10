import { describeAnalyticsProviderContract } from '../contracts/analytics-provider.contract';
import { MockAnalyticsProvider } from '../mocks/mock-analytics-provider';

describe('mock analytics provider contracts', () => {
  describeAnalyticsProviderContract(() => new MockAnalyticsProvider());

  it('records tracked events and errors when enabled and ignores when disabled', async () => {
    const provider = new MockAnalyticsProvider();
    await provider.identify('u_1', { role: 'member' });
    await provider.track('screen_viewed', { screen: 'home' });
    await provider.captureError(new Error('Boom'), { step: 'init' });

    expect(provider.getCurrentUserId()).toBe('u_1');
    expect(provider.getUserTraits()).toEqual({ role: 'member' });
    expect(provider.getTrackedEvents()).toHaveLength(1);
    expect(provider.getCapturedErrors()).toHaveLength(1);

    provider.setEnabled(false);
    await provider.track('ignored');
    expect(provider.getTrackedEvents()).toHaveLength(1);
  });
});
