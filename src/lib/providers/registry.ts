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

export type ProviderKind = 'auth' | 'data' | 'billing';

export type ProviderTypeMap = {
  readonly auth: AuthProvider;
  readonly data: DataRepository<Profile>;
  readonly billing: BillingProvider;
};

export type ProviderFactory<K extends ProviderKind> = () => ProviderTypeMap[K];

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

const authRegistry = new Map<string, ProviderFactory<'auth'>>();
const dataRegistry = new Map<string, ProviderFactory<'data'>>();
const billingRegistry = new Map<string, ProviderFactory<'billing'>>();

function getRegistry<K extends ProviderKind>(kind: K): Map<string, ProviderFactory<K>> {
  switch (kind) {
    case 'auth':
      return authRegistry as unknown as Map<string, ProviderFactory<K>>;
    case 'data':
      return dataRegistry as unknown as Map<string, ProviderFactory<K>>;
    case 'billing':
      return billingRegistry as unknown as Map<string, ProviderFactory<K>>;
  }
}

export function register<K extends ProviderKind>(
  kind: K,
  name: string,
  factory: ProviderFactory<K>,
): void {
  const registry = getRegistry(kind);
  registry.set(name.toLowerCase(), factory);
}

function getEnvValue(name: string): string | undefined {
  const publicVar = `EXPO_PUBLIC_${name}`;
  return process.env[publicVar] ?? process.env[name];
}

function resolveProviderName(kind: ProviderKind, explicitName?: string): string {
  if (explicitName && explicitName.trim() !== '') {
    return explicitName.trim().toLowerCase();
  }

  let envVal: string | undefined;
  switch (kind) {
    case 'auth':
      envVal = getEnvValue('AUTH_PROVIDER');
      break;
    case 'data':
      envVal = getEnvValue('DATA_PROVIDER');
      break;
    case 'billing':
      envVal = getEnvValue('BILLING_PROVIDER');
      break;
  }

  return envVal && envVal.trim() !== '' ? envVal.trim().toLowerCase() : 'mock';
}

function getProvider<K extends ProviderKind>(
  kind: K,
  explicitName?: string,
): ProviderTypeMap[K] {
  const name = resolveProviderName(kind, explicitName);
  const registry = getRegistry(kind);
  const factory = registry.get(name);

  if (!factory) {
    const validNames = Array.from(registry.keys()).join(', ');
    throw new Error(
      `Unknown ${kind} provider "${name}". Valid ${kind} providers: ${validNames || 'none'}.`,
    );
  }

  return factory();
}

export function getAuthProvider(name?: string): AuthProvider {
  return getProvider('auth', name);
}

export function getProfileRepository(name?: string): DataRepository<Profile> {
  return getProvider('data', name);
}

export function getBillingProvider(name?: string): BillingProvider {
  return getProvider('billing', name);
}

export function initDefaultProviders(): void {
  authRegistry.clear();
  dataRegistry.clear();
  billingRegistry.clear();

  register('auth', 'mock', () => mockAuthProvider);
  register('data', 'mock', () => mockProfileRepository);
  register('billing', 'mock', () => mockBillingProvider);
}

export function getBackendAdapter(): BackendAdapter {
  const authName = resolveProviderName('auth');
  const dataName = resolveProviderName('data');
  const isMock = authName === 'mock' && dataName === 'mock';

  return {
    name: isMock ? 'Mock' : `${authName}/${dataName}`,
    mode: isMock ? 'mock' : 'live',
    auth: getAuthProvider(),
    profiles: getProfileRepository(),
  };
}

export function getBillingAdapter(): BillingAdapter {
  const billingName = resolveProviderName('billing');
  const isMock = billingName === 'mock';
  const billing = getBillingProvider();

  return {
    name: isMock ? 'Mock' : billingName,
    mode: isMock ? 'mock' : 'live',
    getOfferings: () => billing.getOfferings(),
    purchase: (offeringId: string) => billing.purchase(offeringId),
    restore: () => billing.restore(),
    getEntitlements: () => billing.getEntitlements(),
    onEntitlementsChange: (callback: EntitlementsChangeCallback) =>
      billing.onEntitlementsChange(callback),
  };
}

initDefaultProviders();
