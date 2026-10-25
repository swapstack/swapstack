import type {
  AuthProvider,
  BillingProvider,
  DataRepository,
  EntitlementsChangeCallback,
  Profile,
} from '@/core';
import {
  mockAuthProvider,
  mockBillingProvider,
  mockProfileRepository,
} from '@/core';

export type BackendAdapter = {
  readonly name: string;
  readonly mode: 'live' | 'mock';
  readonly auth: AuthProvider;
  readonly profiles: DataRepository<Profile>;
};

export type BillingAdapter = BillingProvider & {
  readonly name: string;
  readonly mode: 'live' | 'mock';
};

const mockBackend: BackendAdapter = {
  name: 'Supabase',
  mode: 'mock',
  auth: mockAuthProvider,
  profiles: mockProfileRepository,
};

const mockBilling: BillingAdapter = {
  name: 'RevenueCat',
  mode: 'mock',
  getOfferings: () => mockBillingProvider.getOfferings(),
  purchase: (offeringId: string) => mockBillingProvider.purchase(offeringId),
  restore: () => mockBillingProvider.restore(),
  getEntitlements: () => mockBillingProvider.getEntitlements(),
  onEntitlementsChange: (callback: EntitlementsChangeCallback) =>
    mockBillingProvider.onEntitlementsChange(callback),
};

export const serviceProviders = {
  backend: mockBackend,
  billing: mockBilling,
};
