import type {
  AnalyticsProvider,
  AuthProvider,
  BillingProvider,
  DataRepository,
  EntitlementsChangeCallback,
  FileStorageProvider,
  NotificationProvider,
  Profile,
  SessionStorage,
} from '@/core';
import {
  mockAnalyticsProvider,
  mockAuthProvider,
  mockBillingProvider,
  mockFileStorageProvider,
  mockNotificationProvider,
  mockProfileRepository,
} from '@/core';
import { SecureSessionStorage } from '@/lib/auth/secure-session-storage';
import { createClerkAuthProvider } from './clerk/auth-provider';
import { createFirebaseAuthProvider } from './firebase/auth-provider';
import { createFirebaseProfileRepository } from './firebase/profile-repository';
import { createRevenueCatBillingProvider } from './revenuecat/billing-provider';
import { createSupabaseAuthProvider, createSupabaseClient } from './supabase/auth-provider';
import { createSupabaseProfileRepository } from './supabase/profile-repository';

export type ProviderKind = 'auth' | 'data' | 'billing' | 'storage' | 'notifications' | 'analytics';

export type ProviderTypeMap = {
  readonly auth: AuthProvider;
  readonly data: DataRepository<Profile>;
  readonly billing: BillingProvider;
  readonly storage: FileStorageProvider;
  readonly notifications: NotificationProvider;
  readonly analytics: AnalyticsProvider;
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
  readonly storage: Map<string, ProviderFactory<'storage'>>;
  readonly notifications: Map<string, ProviderFactory<'notifications'>>;
  readonly analytics: Map<string, ProviderFactory<'analytics'>>;
};

type InstanceStore = {
  readonly auth: Map<string, AuthProvider>;
  readonly data: Map<string, DataRepository<Profile>>;
  readonly billing: Map<string, BillingProvider>;
  readonly storage: Map<string, FileStorageProvider>;
  readonly notifications: Map<string, NotificationProvider>;
  readonly analytics: Map<string, AnalyticsProvider>;
};

const registries: RegistryStore = {
  auth: new Map(),
  data: new Map(),
  billing: new Map(),
  storage: new Map(),
  notifications: new Map(),
  analytics: new Map(),
};

const instances: InstanceStore = {
  auth: new Map(),
  data: new Map(),
  billing: new Map(),
  storage: new Map(),
  notifications: new Map(),
  analytics: new Map(),
};

let cachedBackendAdapter: BackendAdapter | null = null;
let cachedBillingAdapter: BillingAdapter | null = null;
let authSessionStorage: SessionStorage = new SecureSessionStorage();
let sharedSupabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

function getSharedSupabaseClient(): ReturnType<typeof createSupabaseClient> {
  sharedSupabaseClient ??= createSupabaseClient();
  return sharedSupabaseClient;
}

export function getAuthSessionStorage(): SessionStorage {
  return authSessionStorage;
}

export function setAuthSessionStorage(storage: SessionStorage): void {
  authSessionStorage = storage;
  instances.auth.clear();
  cachedBackendAdapter = null;
}

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
    case 'storage':
      registries.storage.set(normalized, factory as ProviderFactory<'storage'>);
      instances.storage.delete(normalized);
      break;
    case 'notifications':
      registries.notifications.set(normalized, factory as ProviderFactory<'notifications'>);
      instances.notifications.delete(normalized);
      break;
    case 'analytics':
      registries.analytics.set(normalized, factory as ProviderFactory<'analytics'>);
      instances.analytics.delete(normalized);
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
    case 'storage':
      envVal = process.env.EXPO_PUBLIC_STORAGE_PROVIDER;
      break;
    case 'notifications':
      envVal = process.env.EXPO_PUBLIC_NOTIFICATIONS_PROVIDER;
      break;
    case 'analytics':
      envVal = process.env.EXPO_PUBLIC_ANALYTICS_PROVIDER;
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
    case 'storage':
      return instances.storage.get(name) as ProviderTypeMap[K] | undefined;
    case 'notifications':
      return instances.notifications.get(name) as ProviderTypeMap[K] | undefined;
    case 'analytics':
      return instances.analytics.get(name) as ProviderTypeMap[K] | undefined;
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
    case 'storage':
      instances.storage.set(name, instance as FileStorageProvider);
      break;
    case 'notifications':
      instances.notifications.set(name, instance as NotificationProvider);
      break;
    case 'analytics':
      instances.analytics.set(name, instance as AnalyticsProvider);
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

export function getFileStorageProvider(name?: string): FileStorageProvider {
  return getProvider('storage', name);
}

export function getNotificationProvider(name?: string): NotificationProvider {
  return getProvider('notifications', name);
}

export function getAnalyticsProvider(name?: string): AnalyticsProvider {
  return getProvider('analytics', name);
}

export function validateProviderConfig(): void {
  const kinds: readonly ProviderKind[] = [
    'auth',
    'data',
    'billing',
    'storage',
    'notifications',
    'analytics',
  ];
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

  const authName = getEnvProviderName('auth');
  const dataName = getEnvProviderName('data');
  if (authName === 'supabase' || dataName === 'supabase') {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!supabaseUrl || !supabaseAnonKey) {
      errors.push('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.');
    }
  }

  if (authName === 'firebase' || dataName === 'firebase') {
    const firebaseKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim();
    const firebaseProjectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    if (!firebaseKey || !firebaseProjectId) {
      errors.push('Missing EXPO_PUBLIC_FIREBASE_API_KEY or EXPO_PUBLIC_FIREBASE_PROJECT_ID.');
    }
  }

  if (authName === 'clerk') {
    const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
    if (!clerkKey) {
      errors.push('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.');
    }
  }

  if (getEnvProviderName('billing') === 'revenuecat') {
    const revenueCatKey = process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY?.trim();
    if (!revenueCatKey) {
      errors.push('Missing EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY.');
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
  registries.storage.clear();
  registries.notifications.clear();
  registries.analytics.clear();

  instances.auth.clear();
  instances.data.clear();
  instances.billing.clear();
  instances.storage.clear();
  instances.notifications.clear();
  instances.analytics.clear();

  cachedBackendAdapter = null;
  cachedBillingAdapter = null;
  sharedSupabaseClient = null;

  register('auth', 'mock', () => mockAuthProvider);
  register('data', 'mock', () => mockProfileRepository);
  register('billing', 'mock', () => mockBillingProvider);
  register('storage', 'mock', () => mockFileStorageProvider);
  register('notifications', 'mock', () => mockNotificationProvider);
  register('analytics', 'mock', () => mockAnalyticsProvider);
  register('auth', 'supabase', () => createSupabaseAuthProvider({ client: getSharedSupabaseClient() }));
  register('data', 'supabase', () => createSupabaseProfileRepository(getSharedSupabaseClient()));
  register('auth', 'firebase', () => createFirebaseAuthProvider());
  register('data', 'firebase', () => createFirebaseProfileRepository());
  register('auth', 'clerk', () => createClerkAuthProvider());
  register('billing', 'revenuecat', () => createRevenueCatBillingProvider());
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
