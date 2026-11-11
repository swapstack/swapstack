import { describeFeatureFlagProviderContract } from '@/core/contracts';
import { createPostHogFeatureFlagProvider } from '../feature-flag-provider';

describeFeatureFlagProviderContract(() =>
  createPostHogFeatureFlagProvider({ apiKey: 'phc_test_key' }));

describe('postHogFeatureFlagProvider configuration', () => {
  it('throws when EXPO_PUBLIC_POSTHOG_API_KEY is missing and no client is injected', () => {
    const prev = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
    delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
    expect(() => createPostHogFeatureFlagProvider()).toThrow(
      /Missing EXPO_PUBLIC_POSTHOG_API_KEY/,
    );
    if (prev !== undefined) {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = prev;
    }
  });
});
