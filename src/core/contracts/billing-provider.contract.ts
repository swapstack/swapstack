import type { BillingProvider } from '../billing';

export function describeBillingProviderContract(
  createProvider: () => Promise<BillingProvider> | BillingProvider,
) {
  describe('BillingProvider contract', () => {
    let provider: BillingProvider;

    beforeEach(async () => {
      provider = await createProvider();
    });

    it('returns available offerings', async () => {
      const offerings = await provider.getOfferings();
      expect(offerings.length).toBeGreaterThan(0);
      expect(offerings[0]).toHaveProperty('id');
      expect(offerings[0]).toHaveProperty('title');
      expect(offerings[0]).toHaveProperty('price');
      expect(offerings[0]).toHaveProperty('entitlementId');
    });

    it('returns initial entitlements', async () => {
      const entitlements = await provider.getEntitlements();
      expect(Array.isArray(entitlements)).toBe(true);
    });

    it('purchases an offering and activates the entitlement', async () => {
      const offerings = await provider.getOfferings();
      const firstOffering = offerings[0];

      const updated = await provider.purchase(firstOffering.id);
      const active = updated.find(e => e.id === firstOffering.entitlementId);

      expect(active).toBeDefined();
      expect(active?.isActive).toBe(true);

      const fetched = await provider.getEntitlements();
      const fetchedActive = fetched.find(e => e.id === firstOffering.entitlementId);
      expect(fetchedActive?.isActive).toBe(true);
    });

    it('restores purchases and returns active entitlements', async () => {
      const offerings = await provider.getOfferings();
      await provider.purchase(offerings[0].id);

      const restored = await provider.restore();
      const active = restored.find(e => e.id === offerings[0].entitlementId);
      expect(active?.isActive).toBe(true);
    });

    it('notifies listeners when entitlements change and supports unsubscribe', async () => {
      const listener = jest.fn();
      const unsubscribe = provider.onEntitlementsChange(listener);
      const offerings = await provider.getOfferings();

      await provider.purchase(offerings[0].id);
      expect(listener).toHaveBeenCalled();

      unsubscribe();
      const callsBefore = listener.mock.calls.length;
      if (offerings.length > 1) {
        await provider.purchase(offerings[1].id);
        expect(listener).toHaveBeenCalledTimes(callsBefore);
      }
    });

    it('throws when purchasing an invalid offering', async () => {
      await expect(provider.purchase('invalid_offering_id')).rejects.toThrow();
    });
  });
}
