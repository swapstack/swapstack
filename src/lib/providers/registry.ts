import type {
  AiProvider,
  AnalyticsProvider,
  AuthProvider,
  BillingProvider,
  BiometricProvider,
  DataRepository,
  EntitlementsChangeCallback,
  ErrorReporterProvider,
  FeatureFlagProvider,
  FileStorageProvider,
  NetworkProvider,
  NotificationProvider,
  Profile,
  SessionStorage,
} from '@/core';
import {
  mockAiProvider,
  mockAnalyticsProvider,
  mockAuthProvider,
  mockBillingProvider,
  mockBiometricProvider,
  mockErrorReporterProvider,
  mockFeatureFlagProvider,
  mockFileStorageProvider,
  mockNetworkProvider,
  mockNotificationProvider,
  mockProfileRepository,
} from '@/core';
import { SecureSessionStorage } from '@/lib/auth/secure-session-storage';
import { createClerkAuthProvider } from './clerk/auth-provider';
import { createExpoNotificationProvider } from './expo-notifications/notification-provider';
import { createFirebaseAuthProvider } from './firebase/auth-provider';
import { createFirebaseProfileRepository } from './firebase/profile-repository';
import { createFirebaseFileStorageProvider } from './firebase/storage-provider';
import { createOpenAiProvider } from './openai/ai-provider';
import { createPostHogAnalyticsProvider } from './posthog/analytics-provider';
import { createRevenueCatBillingProvider } from './revenuecat/billing-provider';
import { createSentryErrorReporterProvider } from './sentry/error-reporter-provider';
import { createSupabaseAuthProvider, createSupabaseClient } from './supabase/auth-provider';
import { createSupabaseProfileRepository } from './supabase/profile-repository';
import { createSupabaseFileStorageProvider } from './supabase/storage-provider';

export type ProviderKind
  = | 'auth'
    | 'data'
    | 'billing'
    | 'storage'
    | 'notifications'
    | 'analytics'
    | 'network'
    | 'featureFlags'
    | 'biometrics'
    | 'ai'
    | 'errorReporter';

export type ProviderTypeMap = {
  readonly auth: AuthProvider;
  readonly data: DataRepository<Profile>;
  readonly billing: BillingProvider;
  readonly storage: FileStorageProvider;
  readonly notifications: NotificationProvider;
  readonly analytics: AnalyticsProvider;
  readonly network: NetworkProvider;
  readonly featureFlags: FeatureFlagProvider;
  readonly biometrics: BiometricProvider;
  readonly ai: AiProvider;
  readonly errorReporter: ErrorReporterProvider;
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
  readonly [K in ProviderKind]: Map<string, ProviderFactory<K>>;
};

type InstanceStore = {
  readonly [K in ProviderKind]: Map<string, ProviderTypeMap[K]>;
};

const registries: RegistryStore = {
  auth: new Map(),
  data: new Map(),
  billing: new Map(),
  storage: new Map(),
  notifications: new Map(),
  analytics: new Map(),
  network: new Map(),
  featureFlags: new Map(),
  biometrics: new Map(),
  ai: new Map(),
  errorReporter: new Map(),
};

const instances: InstanceStore = {
  auth: new Map(),
  data: new Map(),
  billing: new Map(),
  storage: new Map(),
  notifications: new Map(),
  analytics: new Map(),
  network: new Map(),
  featureFlags: new Map(),
  biometrics: new Map(),
  ai: new Map(),
  errorReporter: new Map(),
};

const PROVIDER_KINDS: readonly ProviderKind[] = [
  'auth',
  'data',
  'billing',
  'storage',
  'notifications',
  'analytics',
  'network',
  'featureFlags',
  'biometrics',
  'ai',
  'errorReporter',
];

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
  registries[kind].set(normalized, factory);
  instances[kind].delete(normalized);
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
    case 'network':
      envVal = process.env.EXPO_PUBLIC_NETWORK_PROVIDER;
      break;
    case 'featureFlags':
      envVal = process.env.EXPO_PUBLIC_FEATURE_FLAGS_PROVIDER;
      break;
    case 'biometrics':
      envVal = process.env.EXPO_PUBLIC_BIOMETRICS_PROVIDER;
      break;
    case 'ai':
      envVal = process.env.EXPO_PUBLIC_AI_PROVIDER;
      break;
    case 'errorReporter':
      envVal = process.env.EXPO_PUBLIC_ERROR_REPORTER_PROVIDER;
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

function getProvider<K extends ProviderKind>(
  kind: K,
  explicitName?: string,
): ProviderTypeMap[K] {
  const name = resolveProviderName(kind, explicitName);
  const cached = instances[kind].get(name);
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

  const created = factory();
  instances[kind].set(name, created);
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

export function getNetworkProvider(name?: string): NetworkProvider {
  return getProvider('network', name);
}

export function getFeatureFlagProvider(name?: string): FeatureFlagProvider {
  return getProvider('featureFlags', name);
}

export function getBiometricProvider(name?: string): BiometricProvider {
  return getProvider('biometrics', name);
}

export function getAiProvider(name?: string): AiProvider {
  return getProvider('ai', name);
}

export function getErrorReporterProvider(name?: string): ErrorReporterProvider {
  return getProvider('errorReporter', name);
}

export function validateProviderConfig(): void {
  const kinds = PROVIDER_KINDS;
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
  const storageName = getEnvProviderName('storage');
  if (authName === 'supabase' || dataName === 'supabase' || storageName === 'supabase') {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!supabaseUrl || !supabaseAnonKey) {
      errors.push('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.');
    }
  }

  if (authName === 'firebase' || dataName === 'firebase' || storageName === 'firebase') {
    const firebaseKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim();
    const firebaseProjectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    if (!firebaseKey || !firebaseProjectId) {
      errors.push('Missing EXPO_PUBLIC_FIREBASE_API_KEY or EXPO_PUBLIC_FIREBASE_PROJECT_ID.');
    }
  }

  if (authName === 'clerk' && !process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()) {
    errors.push('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.');
  }

  if (getEnvProviderName('analytics') === 'posthog' && !process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim()) {
    errors.push('Missing EXPO_PUBLIC_POSTHOG_API_KEY.');
  }

  if (getEnvProviderName('billing') === 'revenuecat' && !process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY?.trim()) {
    errors.push('Missing EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY.');
  }

  if (getEnvProviderName('ai') === 'openai' && !process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim()) {
    errors.push('Missing EXPO_PUBLIC_OPENAI_API_KEY.');
  }

  if (getEnvProviderName('errorReporter') === 'sentry' && !process.env.EXPO_PUBLIC_SENTRY_DSN?.trim()) {
    errors.push('Missing EXPO_PUBLIC_SENTRY_DSN.');
  }

  if (errors.length > 0) {
    throw new Error(`Provider configuration error:\n${errors.join('\n')}`);
  }
}

export function initDefaultProviders(): void {
  for (const kind of PROVIDER_KINDS) {
    registries[kind].clear();
    instances[kind].clear();
  }

  cachedBackendAdapter = null;
  cachedBillingAdapter = null;
  sharedSupabaseClient = null;

  register('auth', 'mock', () => mockAuthProvider);
  register('data', 'mock', () => mockProfileRepository);
  register('billing', 'mock', () => mockBillingProvider);
  register('storage', 'mock', () => mockFileStorageProvider);
  register('notifications', 'mock', () => mockNotificationProvider);
  register('analytics', 'mock', () => mockAnalyticsProvider);
  register('network', 'mock', () => mockNetworkProvider);
  register('featureFlags', 'mock', () => mockFeatureFlagProvider);
  register('biometrics', 'mock', () => mockBiometricProvider);
  register('ai', 'mock', () => mockAiProvider);
  register('errorReporter', 'mock', () => mockErrorReporterProvider);
  register('auth', 'supabase', () => createSupabaseAuthProvider({ client: getSharedSupabaseClient() }));
  register('data', 'supabase', () => createSupabaseProfileRepository(getSharedSupabaseClient()));
  register('storage', 'supabase', () => createSupabaseFileStorageProvider());
  register('auth', 'firebase', () => createFirebaseAuthProvider());
  register('data', 'firebase', () => createFirebaseProfileRepository());
  register('storage', 'firebase', () => createFirebaseFileStorageProvider());
  register('auth', 'clerk', () => createClerkAuthProvider());
  register('billing', 'revenuecat', () => createRevenueCatBillingProvider());
  register('notifications', 'expo', () => createExpoNotificationProvider());
  register('analytics', 'posthog', () => createPostHogAnalyticsProvider());
  register('ai', 'openai', () => createOpenAiProvider());
  register('errorReporter', 'sentry', () => createSentryErrorReporterProvider());
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
