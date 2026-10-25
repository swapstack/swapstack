import {
  describeAuthProviderContract,
  describeBillingProviderContract,
  describeDataRepositoryContract,
  mockAuthProvider,
  mockBillingProvider,
  mockProfileRepository,
} from '@/core';
import { serviceProviders } from '@/lib/services';

describe('serviceProviders Backend Adapter', () => {
  beforeEach(() => {
    mockAuthProvider.reset();
    mockProfileRepository.reset();
  });

  it('exposes backend adapter metadata', () => {
    expect(serviceProviders.backend.name).toBe('Supabase');
    expect(serviceProviders.backend.mode).toBe('mock');
  });

  describe('implements AuthProvider contract', () => {
    describeAuthProviderContract(() => {
      mockAuthProvider.reset();
      return serviceProviders.backend;
    });
  });

  describe('implements DataRepository contract', () => {
    describeDataRepositoryContract(() => {
      mockProfileRepository.reset();
      return serviceProviders.backend;
    });
  });
});

describe('serviceProviders Billing Adapter', () => {
  beforeEach(() => {
    mockBillingProvider.reset();
  });

  it('exposes billing adapter metadata', () => {
    expect(serviceProviders.billing.name).toBe('RevenueCat');
    expect(serviceProviders.billing.mode).toBe('mock');
  });

  describe('implements BillingProvider contract', () => {
    describeBillingProviderContract(() => {
      mockBillingProvider.reset();
      return serviceProviders.billing;
    });
  });
});
