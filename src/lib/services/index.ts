import type {
  AuthProvider,
  AuthStateChangeCallback,
  BillingProvider,
  DataChangeCallback,
  DataRepository,
  EntitlementsChangeCallback,
  Profile,
  SignInCredentials,
  SignUpCredentials,
} from '@/core';
import {
  mockAuthProvider,
  mockBillingProvider,
  mockProfileRepository,
} from '@/core';

export type BackendAdapter = AuthProvider
  & DataRepository<Profile> & {
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
  signIn: (credentials: SignInCredentials) => mockAuthProvider.signIn(credentials),
  signUp: (credentials: SignUpCredentials) => mockAuthProvider.signUp(credentials),
  signOut: () => mockAuthProvider.signOut(),
  getSession: () => mockAuthProvider.getSession(),
  onAuthChange: (callback: AuthStateChangeCallback) => mockAuthProvider.onAuthChange(callback),
  get: (id: string) => mockProfileRepository.get(id),
  update: (id: string, data: Partial<Profile>) => mockProfileRepository.update(id, data),
  subscribe: (id: string, callback: DataChangeCallback<Profile>) =>
    mockProfileRepository.subscribe(id, callback),
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
