import type { Profile } from '../types';
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
  MockAuthProvider,
  MockBillingProvider,
  MockDataRepository,
};

export const mockAuthProvider = new MockAuthProvider();
export const mockProfileRepository = new MockDataRepository<Profile>();
export const mockBillingProvider = new MockBillingProvider();
