import type { Profile } from '../types';
import { InMemorySessionStorage } from './in-memory-session-storage';
import { MockAuthProvider } from './mock-auth-provider';
import {
  DEFAULT_MOCK_ENTITLEMENTS,
  DEFAULT_MOCK_OFFERINGS,
  MockBillingProvider,
} from './mock-billing-provider';
import { MockDataRepository } from './mock-data-repository';

export {
  DEFAULT_MOCK_ENTITLEMENTS,
  DEFAULT_MOCK_OFFERINGS,
  InMemorySessionStorage,
  MockAuthProvider,
  MockBillingProvider,
  MockDataRepository,
};

export const mockAuthProvider = new MockAuthProvider();
export const mockProfileRepository = new MockDataRepository<Profile>();
export const mockBillingProvider = new MockBillingProvider();
