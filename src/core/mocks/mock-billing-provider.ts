import type { BillingProvider, EntitlementsChangeCallback } from '../billing';
import type { Entitlement, Offering, Unsubscribe } from '../types';
import { BillingError } from '../errors';

export const DEFAULT_MOCK_OFFERINGS: readonly Offering[] = [
  {
    id: 'pro_monthly',
    title: 'Pro Monthly',
    description: 'Full access billed monthly',
    price: '$4.99/mo',
    entitlementId: 'pro',
  },
  {
    id: 'pro_annual',
    title: 'Pro Annual',
    description: 'Full access billed annually',
    price: '$39.99/yr',
    entitlementId: 'pro',
  },
];

export const DEFAULT_MOCK_ENTITLEMENTS: readonly Entitlement[] = [
  {
    id: 'pro',
    isActive: false,
    expirationDate: null,
  },
];

export class MockBillingProvider implements BillingProvider {
  private offerings: Offering[];
  private entitlements: Map<string, Entitlement>;
  private readonly listeners = new Set<EntitlementsChangeCallback>();

  constructor(
    initialOfferings: readonly Offering[] = DEFAULT_MOCK_OFFERINGS,
    initialEntitlements: readonly Entitlement[] = DEFAULT_MOCK_ENTITLEMENTS,
  ) {
    this.offerings = initialOfferings.map(o => ({ ...o }));
    this.entitlements = new Map(initialEntitlements.map(e => [e.id, { ...e }]));
  }

  readonly getOfferings = async (): Promise<Offering[]> => {
    return this.offerings.map(o => ({ ...o }));
  };

  readonly getEntitlements = async (): Promise<Entitlement[]> => {
    return Array.from(this.entitlements.values()).map(e => ({ ...e }));
  };

  readonly purchase = async (offeringId: string): Promise<Entitlement[]> => {
    if (offeringId === 'cancelled') {
      throw new BillingError('Purchase was cancelled by the user', 'cancelled');
    }

    const offering = this.offerings.find(o => o.id === offeringId);
    if (!offering) {
      throw new BillingError(`Offering not found: ${offeringId}`, 'offering_not_found');
    }

    const current = this.entitlements.get(offering.entitlementId);
    const updated: Entitlement = {
      id: offering.entitlementId,
      isActive: true,
      expirationDate: current?.expirationDate ?? null,
    };

    this.entitlements.set(offering.entitlementId, updated);
    this.notifyListeners();
    return this.getEntitlements();
  };

  readonly restore = async (): Promise<Entitlement[]> => {
    return this.getEntitlements();
  };

  readonly onEntitlementsChange = (callback: EntitlementsChangeCallback): Unsubscribe => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  /**
   * Test-only helper to reset billing state, offerings, entitlements, and listeners.
   */
  readonly reset = (
    offerings: readonly Offering[] = DEFAULT_MOCK_OFFERINGS,
    entitlements: readonly Entitlement[] = DEFAULT_MOCK_ENTITLEMENTS,
  ): void => {
    this.offerings = offerings.map(o => ({ ...o }));
    this.entitlements = new Map(entitlements.map(e => [e.id, { ...e }]));
    this.listeners.clear();
  };

  private notifyListeners(): void {
    const list = Array.from(this.entitlements.values()).map(e => ({ ...e }));
    for (const listener of this.listeners) {
      try {
        listener(list);
      }
      catch {
        // Silently ignore listener errors to prevent breaking other listeners
      }
    }
  }
}
