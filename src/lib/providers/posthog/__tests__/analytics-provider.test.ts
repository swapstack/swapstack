import { describeAnalyticsProviderContract } from '@/core/contracts/analytics-provider.contract';
import { createPostHogAnalyticsProvider } from '../analytics-provider';

describe('posthog analytics provider', () => {
  describeAnalyticsProviderContract(() =>
    createPostHogAnalyticsProvider({
      client: {
        identify: jest.fn(async () => {}),
        capture: jest.fn(async () => {}),
        reset: jest.fn(async () => {}),
      },
    }),
  );
});
