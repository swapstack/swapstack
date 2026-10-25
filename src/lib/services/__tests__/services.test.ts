import {
  mockAuthProvider,
  mockBillingProvider,
  mockProfileRepository,
} from '@/core';
import {
  describeAuthProviderContract,
  describeBillingProviderContract,
  describeDataRepositoryContract,
} from '@/core/contracts';
import { serviceProviders } from '@/lib/services';

describe('serviceProviders Backend Adapter', () => {
  beforeEach(() => {
    mockAuthProvider.reset();
    mockProfileRepository.reset();
  });

  it('exposes backend adapter metadata and services', () => {
    expect(serviceProviders.backend.name).toBe('Mock');
    expect(serviceProviders.backend.mode).toBe('mock');
    expect(serviceProviders.backend.auth).toBe(mockAuthProvider);
    expect(serviceProviders.backend.profiles).toBe(mockProfileRepository);
  });

  describe('implements auth provider contract', () => {
    describeAuthProviderContract(() => {
      mockAuthProvider.reset();
      return serviceProviders.backend.auth;
    });
  });

  describe('implements data repository contract', () => {
    describeDataRepositoryContract(() => {
      mockProfileRepository.reset();
      return serviceProviders.backend.profiles;
    });
  });
});

describe('serviceProviders Billing Adapter', () => {
  beforeEach(() => {
    mockBillingProvider.reset();
  });

  it('exposes billing adapter metadata', () => {
    expect(serviceProviders.billing.name).toBe('Mock');
    expect(serviceProviders.billing.mode).toBe('mock');
  });

  describe('implements billing provider contract', () => {
    describeBillingProviderContract(() => {
      mockBillingProvider.reset();
      return serviceProviders.billing;
    });
  });
});
