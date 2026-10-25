import type { Entitlement, Offering, Unsubscribe } from './types';

export type EntitlementsChangeCallback = (entitlements: Entitlement[]) => void;

export type BillingProvider = {
  readonly getOfferings: () => Promise<Offering[]>;
  readonly purchase: (offeringId: string) => Promise<Entitlement[]>;
  readonly restore: () => Promise<Entitlement[]>;
  readonly getEntitlements: () => Promise<Entitlement[]>;
  readonly onEntitlementsChange: (callback: EntitlementsChangeCallback) => Unsubscribe;
};
