import type { BillingProvider } from '../billing';

export function describeBillingReadOnlyContract(
  createProvider: () => Promise<BillingProvider> | BillingProvider,
) {
  describe('billing provider read-only contract', () => {
    let provider: BillingProvider;

    beforeEach(async () => {
      provider = await createProvider();
    });

    it('returns available offerings matching expected shape and types', async () => {
      const offerings = await provider.getOfferings();
      expect(offerings.length).toBeGreaterThan(0);

      for (const offering of offerings) {
        expect(typeof offering.id).toBe('string');
        expect(offering.id.trim().length).toBeGreaterThan(0);
        expect(typeof offering.title).toBe('string');
        expect(offering.title.trim().length).toBeGreaterThan(0);
        expect(typeof offering.price).toBe('string');
        expect(offering.price.trim().length).toBeGreaterThan(0);
        expect(typeof offering.entitlementId).toBe('string');
        expect(offering.entitlementId.trim().length).toBeGreaterThan(0);
      }
    });

    it('returns entitlements as an array', async () => {
      const entitlements = await provider.getEntitlements();
      expect(Array.isArray(entitlements)).toBe(true);
    });

    it('rejects purchasing an invalid offering id with offering_not_found code', async () => {
      await expect(provider.purchase('invalid_offering_id')).rejects.toMatchObject({
        code: 'offering_not_found',
      });
    });
  });
}

export function describeBillingPurchaseContract(
  createProvider: () => Promise<BillingProvider> | BillingProvider,
) {
  describe('billing provider purchase contract', () => {
    let provider: BillingProvider;

    beforeEach(async () => {
      provider = await createProvider();
    });

    it('returns no active entitlements on restore with no prior purchases', async () => {
      const restored = await provider.restore();
      const active = restored.filter(e => e.isActive);
      expect(active).toHaveLength(0);
    });

    it('purchases an offering and activates the entitlement', async () => {
      const offerings = await provider.getOfferings();
      const target = offerings[0];

      const updated = await provider.purchase(target.id);
      const active = updated.find(e => e.id === target.entitlementId);

      expect(active).toBeDefined();
      expect(active?.isActive).toBe(true);

      const current = await provider.getEntitlements();
      expect(current.find(e => e.id === target.entitlementId)?.isActive).toBe(true);
    });

    it('purchasing the same offering twice does not duplicate entitlements', async () => {
      const offerings = await provider.getOfferings();
      const target = offerings[0];

      await provider.purchase(target.id);
      const secondPurchase = await provider.purchase(target.id);

      const matches = secondPurchase.filter(e => e.id === target.entitlementId);
      expect(matches).toHaveLength(1);
      expect(matches[0].isActive).toBe(true);
    });

    it('restores purchases and returns active entitlements', async () => {
      const offerings = await provider.getOfferings();
      await provider.purchase(offerings[0].id);

      const restored = await provider.restore();
      const active = restored.find(e => e.id === offerings[0].entitlementId);
      expect(active?.isActive).toBe(true);
    });

    it('handles cancellation by throwing BillingError with cancelled code', async () => {
      await expect(provider.purchase('cancelled')).rejects.toMatchObject({
        code: 'cancelled',
      });
    });

    it('notifies listener with active entitlement and unbinds unconditionally', async () => {
      const listener = jest.fn();
      const unsubscribe = provider.onEntitlementsChange(listener);
      const offerings = await provider.getOfferings();
      const target = offerings[0];

      await provider.purchase(target.id);
      expect(listener).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: target.entitlementId,
            isActive: true,
          }),
        ]),
      );

      unsubscribe();
      await provider.purchase(target.id);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
}

export function describeBillingProviderContract(
  createProvider: () => Promise<BillingProvider> | BillingProvider,
) {
  describeBillingReadOnlyContract(createProvider);
  describeBillingPurchaseContract(createProvider);
}
