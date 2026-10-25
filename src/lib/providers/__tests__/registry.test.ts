import fs from 'node:fs';
import path from 'node:path';
import {
  MockAuthProvider,
  mockAuthProvider,
  mockBillingProvider,
  mockProfileRepository,
} from '@/core';
import {
  describeAuthProviderContract,
  describeBillingProviderContract,
  describeDataRepositoryContract,
} from '@/core/contracts';
import {
  getAuthProvider,
  getBackendAdapter,
  getBillingAdapter,
  getBillingProvider,
  getProfileRepository,
  initDefaultProviders,
  register,
  validateProviderConfig,
} from '../registry';

function setExpoEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  }
  else {
    process.env[key] = value;
  }

  try {
    const virtual = require('expo/virtual/env') as { env: Record<string, string | undefined> };
    if (value === undefined) {
      delete virtual.env[key];
    }
    else {
      virtual.env[key] = value;
    }
  }
  catch {
    // Expo virtual env not present outside babel-preset-expo
  }
}

describe('provider registry resolution', () => {
  beforeEach(() => {
    setExpoEnv('EXPO_PUBLIC_AUTH_PROVIDER', undefined);
    setExpoEnv('EXPO_PUBLIC_DATA_PROVIDER', undefined);
    setExpoEnv('EXPO_PUBLIC_BILLING_PROVIDER', undefined);
    initDefaultProviders();
  });

  afterAll(() => {
    setExpoEnv('EXPO_PUBLIC_AUTH_PROVIDER', undefined);
    setExpoEnv('EXPO_PUBLIC_DATA_PROVIDER', undefined);
    setExpoEnv('EXPO_PUBLIC_BILLING_PROVIDER', undefined);
    initDefaultProviders();
  });

  it('reads env variables using literal references and avoids computed process.env lookups', () => {
    const registryPath = path.resolve(__dirname, '../registry.ts');
    const source = fs.readFileSync(registryPath, 'utf8');

    expect(source).not.toMatch(/process\.env\[/);
    expect(source).toContain('process.env.EXPO_PUBLIC_AUTH_PROVIDER');
    expect(source).toContain('process.env.EXPO_PUBLIC_DATA_PROVIDER');
    expect(source).toContain('process.env.EXPO_PUBLIC_BILLING_PROVIDER');
  });

  it('resolves defaults to mock providers and adapters', () => {
    expect(getAuthProvider()).toBe(mockAuthProvider);
    expect(getProfileRepository()).toBe(mockProfileRepository);
    expect(getBillingProvider()).toBe(mockBillingProvider);

    const backend = getBackendAdapter();
    expect(backend.name).toBe('Mock');
    expect(backend.mode).toBe('mock');
    expect(backend.auth).toBe(mockAuthProvider);
    expect(backend.profiles).toBe(mockProfileRepository);

    const billing = getBillingAdapter();
    expect(billing.name).toBe('Mock');
    expect(billing.mode).toBe('mock');
  });

  it('resolves provider names configured via EXPO_PUBLIC environment variables', () => {
    const customAuth = new MockAuthProvider();
    register('auth', 'custom', () => customAuth);

    setExpoEnv('EXPO_PUBLIC_AUTH_PROVIDER', 'custom');
    expect(getAuthProvider()).toBe(customAuth);
  });

  it('normalizes whitespace when registering provider names', () => {
    const customAuth = new MockAuthProvider();
    register('auth', ' custom ', () => customAuth);

    expect(getAuthProvider('custom')).toBe(customAuth);
  });

  it('throws an error listing valid provider names when unknown provider is requested', () => {
    expect(() => getAuthProvider('unknown')).toThrow(
      'Unknown auth provider "unknown". Valid auth providers: mock.',
    );
    expect(() => getProfileRepository('unknown')).toThrow(
      'Unknown data provider "unknown". Valid data providers: mock.',
    );
    expect(() => getBillingProvider('unknown')).toThrow(
      'Unknown billing provider "unknown". Valid billing providers: mock.',
    );
  });
});

describe('provider registry caching and adapters', () => {
  beforeEach(() => {
    setExpoEnv('EXPO_PUBLIC_AUTH_PROVIDER', undefined);
    setExpoEnv('EXPO_PUBLIC_DATA_PROVIDER', undefined);
    setExpoEnv('EXPO_PUBLIC_BILLING_PROVIDER', undefined);
    initDefaultProviders();
  });

  afterAll(() => {
    setExpoEnv('EXPO_PUBLIC_AUTH_PROVIDER', undefined);
    setExpoEnv('EXPO_PUBLIC_DATA_PROVIDER', undefined);
    setExpoEnv('EXPO_PUBLIC_BILLING_PROVIDER', undefined);
    initDefaultProviders();
  });

  it('caches resolved provider instances and clears cache when re-registering', () => {
    const factorySpy = jest.fn(() => new MockAuthProvider());
    register('auth', 'cached_test', factorySpy);

    const first = getAuthProvider('cached_test');
    const second = getAuthProvider('cached_test');
    expect(first).toBe(second);
    expect(factorySpy).toHaveBeenCalledTimes(1);

    const replacementSpy = jest.fn(() => new MockAuthProvider());
    register('auth', 'cached_test', replacementSpy);

    const third = getAuthProvider('cached_test');
    expect(third).not.toBe(first);
    expect(replacementSpy).toHaveBeenCalledTimes(1);
  });

  it('validates provider config at startup and flags invalid providers', () => {
    expect(() => validateProviderConfig()).not.toThrow();

    setExpoEnv('EXPO_PUBLIC_AUTH_PROVIDER', 'bad_auth');
    setExpoEnv('EXPO_PUBLIC_BILLING_PROVIDER', 'bad_billing');

    expect(() => validateProviderConfig()).toThrow(
      /Invalid auth provider "bad_auth"[\s\S]*Invalid billing provider "bad_billing"/,
    );
  });

  it('caches BackendAdapter and BillingAdapter objects across calls', () => {
    const backend1 = getBackendAdapter();
    const backend2 = getBackendAdapter();
    expect(backend1).toBe(backend2);

    const billing1 = getBillingAdapter();
    const billing2 = getBillingAdapter();
    expect(billing1).toBe(billing2);
  });

  it('reports mode from provider implementations instead of registered names', () => {
    // Register custom provider with explicit mode: 'live'
    register('billing', 'custom_live', () => ({
      ...mockBillingProvider,
      mode: 'live',
    }));
    setExpoEnv('EXPO_PUBLIC_BILLING_PROVIDER', 'custom_live');

    const adapter = getBillingAdapter();
    expect(adapter.mode).toBe('live');
    expect(adapter.name).toBe('custom_live');
  });
});

describe('contract tests on registered default providers', () => {
  beforeEach(() => {
    initDefaultProviders();
  });

  describeAuthProviderContract(() => {
    mockAuthProvider.reset();
    return getAuthProvider();
  });

  describeDataRepositoryContract(() => {
    mockProfileRepository.reset();
    return getProfileRepository();
  });

  describeBillingProviderContract(() => {
    mockBillingProvider.reset();
    return getBillingProvider();
  });
});
