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

type RegistryStore = {
  readonly auth: Map<string, ProviderFactory<'auth'>>;
  readonly data: Map<string, ProviderFactory<'data'>>;
  readonly billing: Map<string, ProviderFactory<'billing'>>;
};

type InstanceStore = {
  readonly auth: Map<string, AuthProvider>;
  readonly data: Map<string, DataRepository<Profile>>;
  readonly billing: Map<string, BillingProvider>;
};

const registries: RegistryStore = {
  auth: new Map(),
  data: new Map(),
  billing: new Map(),
};

const instances: InstanceStore = {
  auth: new Map(),
  data: new Map(),
  billing: new Map(),
};

let cachedBackendAdapter: BackendAdapter | null = null;
let cachedBillingAdapter: BillingAdapter | null = null;

export function register<K extends ProviderKind>(
  kind: K,
  name: string,
  factory: ProviderFactory<K>,
): void {
  const normalized = name.trim().toLowerCase();
  cachedBackendAdapter = null;
  cachedBillingAdapter = null;
  switch (kind) {
    case 'auth':
      registries.auth.set(normalized, factory as ProviderFactory<'auth'>);
      instances.auth.delete(normalized);
      break;
    case 'data':
      registries.data.set(normalized, factory as ProviderFactory<'data'>);
      instances.data.delete(normalized);
      break;
    case 'billing':
      registries.billing.set(normalized, factory as ProviderFactory<'billing'>);
      instances.billing.delete(normalized);
      break;
  }
}

function getEnvProviderName(kind: ProviderKind): string {
  let envVal: string | undefined;
  switch (kind) {
    case 'auth':
      envVal = process.env.EXPO_PUBLIC_AUTH_PROVIDER;
      break;
    case 'data':
      envVal = process.env.EXPO_PUBLIC_DATA_PROVIDER;
      break;
    case 'billing':
      envVal = process.env.EXPO_PUBLIC_BILLING_PROVIDER;
      break;
  }

  return envVal && envVal.trim() !== '' ? envVal.trim().toLowerCase() : 'mock';
}

function resolveProviderName(kind: ProviderKind, explicitName?: string): string {
  if (explicitName && explicitName.trim() !== '') {
    return explicitName.trim().toLowerCase();
  }

  return getEnvProviderName(kind);
}

function getCachedInstance<K extends ProviderKind>(
  kind: K,
  name: string,
): ProviderTypeMap[K] | undefined {
  switch (kind) {
    case 'auth':
      return instances.auth.get(name) as ProviderTypeMap[K] | undefined;
    case 'data':
      return instances.data.get(name) as ProviderTypeMap[K] | undefined;
    case 'billing':
      return instances.billing.get(name) as ProviderTypeMap[K] | undefined;
  }
}

function cacheInstance<K extends ProviderKind>(
  kind: K,
  name: string,
  instance: ProviderTypeMap[K],
): void {
  switch (kind) {
    case 'auth':
      instances.auth.set(name, instance as AuthProvider);
      break;
    case 'data':
      instances.data.set(name, instance as DataRepository<Profile>);
      break;
    case 'billing':
      instances.billing.set(name, instance as BillingProvider);
      break;
  }
}

function getProvider<K extends ProviderKind>(
  kind: K,
  explicitName?: string,
): ProviderTypeMap[K] {
  const name = resolveProviderName(kind, explicitName);
  const cached = getCachedInstance(kind, name);
  if (cached) {
    return cached;
  }

  const factory = registries[kind].get(name);
  if (!factory) {
    const validNames = Array.from(registries[kind].keys()).join(', ');
    throw new Error(
      `Unknown ${kind} provider "${name}". Valid ${kind} providers: ${validNames || 'none'}.`,
    );
  }

  const created = factory() as ProviderTypeMap[K];
  cacheInstance(kind, name, created);
  return created;
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

export function validateProviderConfig(): void {
  const kinds: readonly ProviderKind[] = ['auth', 'data', 'billing'];
  const errors: string[] = [];

  for (const kind of kinds) {
    const name = getEnvProviderName(kind);
    if (!registries[kind].has(name)) {
      const validNames = Array.from(registries[kind].keys()).join(', ');
      errors.push(
        `Invalid ${kind} provider "${name}". Valid ${kind} providers: ${validNames || 'none'}.`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Provider configuration error:\n${errors.join('\n')}`);
  }
}

export function initDefaultProviders(): void {
  registries.auth.clear();
  registries.data.clear();
  registries.billing.clear();

  instances.auth.clear();
  instances.data.clear();
  instances.billing.clear();

  cachedBackendAdapter = null;
  cachedBillingAdapter = null;

  register('auth', 'mock', () => mockAuthProvider);
  register('data', 'mock', () => mockProfileRepository);
  register('billing', 'mock', () => mockBillingProvider);
}

export function getBackendAdapter(): BackendAdapter {
  if (cachedBackendAdapter) {
    return cachedBackendAdapter;
  }

  const auth = getAuthProvider();
  const profiles = getProfileRepository();
  const authName = resolveProviderName('auth');
  const dataName = resolveProviderName('data');
  const authMode = auth.mode ?? 'live';
  const profilesMode = profiles.mode ?? 'live';
  const mode = (authMode === 'mock' && profilesMode === 'mock') ? 'mock' : 'live';
  const isMock = mode === 'mock';

  cachedBackendAdapter = {
    name: isMock ? 'Mock' : `${authName}/${dataName}`,
    mode,
    auth,
    profiles,
  };
  return cachedBackendAdapter;
}

export function getBillingAdapter(): BillingAdapter {
  if (cachedBillingAdapter) {
    return cachedBillingAdapter;
  }

  const billing = getBillingProvider();
  const billingName = resolveProviderName('billing');
  const mode = billing.mode ?? 'live';
  const isMock = mode === 'mock';

  cachedBillingAdapter = {
    name: isMock ? 'Mock' : billingName,
    mode,
    getOfferings: () => billing.getOfferings(),
    purchase: (offeringId: string) => billing.purchase(offeringId),
    restore: () => billing.restore(),
    getEntitlements: () => billing.getEntitlements(),
    onEntitlementsChange: (callback: EntitlementsChangeCallback) =>
      billing.onEntitlementsChange(callback),
  };
  return cachedBillingAdapter;
}

initDefaultProviders();
