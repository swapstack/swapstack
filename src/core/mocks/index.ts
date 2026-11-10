import type { Profile } from '../types';
import { InMemorySessionStorage } from './in-memory-session-storage';
import { MockAnalyticsProvider } from './mock-analytics-provider';
import { MockAuthProvider } from './mock-auth-provider';
import {
  DEFAULT_MOCK_ENTITLEMENTS,
  DEFAULT_MOCK_OFFERINGS,
  MockBillingProvider,
} from './mock-billing-provider';
import { MockDataRepository } from './mock-data-repository';
import { MockFileStorageProvider } from './mock-file-storage';
import { MockNotificationProvider } from './mock-notification-provider';

export {
  DEFAULT_MOCK_ENTITLEMENTS,
  DEFAULT_MOCK_OFFERINGS,
  InMemorySessionStorage,
  MockAnalyticsProvider,
  MockAuthProvider,
  MockBillingProvider,
  MockDataRepository,
  MockFileStorageProvider,
  MockNotificationProvider,
};

export const mockAuthProvider = new MockAuthProvider();
export const mockProfileRepository = new MockDataRepository<Profile>();
export const mockBillingProvider = new MockBillingProvider();
export const mockFileStorageProvider = new MockFileStorageProvider();
export const mockNotificationProvider = new MockNotificationProvider();
export const mockAnalyticsProvider = new MockAnalyticsProvider();
