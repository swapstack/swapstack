import type { FeatureFlagProvider } from '../feature-flags';

export function describeFeatureFlagProviderContract(
  createProvider: () => Promise<FeatureFlagProvider> | FeatureFlagProvider,
) {
  describe('feature flag provider contract', () => {
    let flags: FeatureFlagProvider;

    beforeEach(async () => {
      flags = await createProvider();
    });

    it('reads boolean flags, string variants, and supports runtime overrides', async () => {
      expect(await flags.isEnabled('unknown_flag', false)).toBe(false);
      expect(await flags.getVariant('unknown_experiment', 'control')).toBe('control');

      const listener = jest.fn();
      const unsubscribe = flags.onFlagsChange(listener);

      await flags.setOverride('beta_dashboard', true);
      expect(await flags.isEnabled('beta_dashboard')).toBe(true);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ beta_dashboard: true }),
      );

      await flags.setOverride('paywall_copy', 'variant_b');
      expect(await flags.getVariant('paywall_copy')).toBe('variant_b');

      const all = await flags.getAllFlags();
      expect(all.beta_dashboard).toBe(true);
      expect(all.paywall_copy).toBe('variant_b');

      unsubscribe();
      await flags.refresh();
    });
  });
}
