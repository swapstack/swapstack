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
} from '../registry';

describe('provider registry', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_AUTH_PROVIDER;
    delete process.env.AUTH_PROVIDER;
    delete process.env.EXPO_PUBLIC_DATA_PROVIDER;
    delete process.env.DATA_PROVIDER;
    delete process.env.EXPO_PUBLIC_BILLING_PROVIDER;
    delete process.env.BILLING_PROVIDER;
    initDefaultProviders();
  });

  afterAll(() => {
    process.env = originalEnv;
    initDefaultProviders();
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

    process.env.EXPO_PUBLIC_AUTH_PROVIDER = 'custom';
    expect(getAuthProvider()).toBe(customAuth);
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

  it('registers and retrieves custom providers', () => {
    const customAuth = new MockAuthProvider();
    register('auth', 'custom_auth', () => customAuth);

    expect(getAuthProvider('custom_auth')).toBe(customAuth);
    expect(getAuthProvider('mock')).toBe(mockAuthProvider);
  });

  describe('contract tests on registered default providers', () => {
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
});
