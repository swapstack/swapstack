import type { Profile } from '../types';
import { InMemorySessionStorage } from './in-memory-session-storage';
import { MockAiProvider } from './mock-ai-provider';
import { MockAnalyticsProvider } from './mock-analytics-provider';
import { MockAuthProvider } from './mock-auth-provider';
import {
  DEFAULT_MOCK_ENTITLEMENTS,
  DEFAULT_MOCK_OFFERINGS,
  MockBillingProvider,
} from './mock-billing-provider';
import { MockBiometricProvider } from './mock-biometric-provider';
import { MockDataRepository } from './mock-data-repository';
import { MockErrorReporterProvider } from './mock-error-reporter-provider';
import {
  DEFAULT_MOCK_FEATURE_FLAGS,
  MockFeatureFlagProvider,
} from './mock-feature-flag-provider';
import { MockFileStorageProvider } from './mock-file-storage';
import { MockNetworkProvider } from './mock-network-provider';
import { MockNotificationProvider } from './mock-notification-provider';

export {
  DEFAULT_MOCK_ENTITLEMENTS,
  DEFAULT_MOCK_FEATURE_FLAGS,
  DEFAULT_MOCK_OFFERINGS,
  InMemorySessionStorage,
  MockAiProvider,
  MockAnalyticsProvider,
  MockAuthProvider,
  MockBillingProvider,
  MockBiometricProvider,
  MockDataRepository,
  MockErrorReporterProvider,
  MockFeatureFlagProvider,
  MockFileStorageProvider,
  MockNetworkProvider,
  MockNotificationProvider,
};

export const mockAuthProvider = new MockAuthProvider();
export const mockProfileRepository = new MockDataRepository<Profile>();
export const mockBillingProvider = new MockBillingProvider();
export const mockFileStorageProvider = new MockFileStorageProvider();
export const mockNotificationProvider = new MockNotificationProvider();
export const mockAnalyticsProvider = new MockAnalyticsProvider();
export const mockNetworkProvider = new MockNetworkProvider();
export const mockFeatureFlagProvider = new MockFeatureFlagProvider();
export const mockBiometricProvider = new MockBiometricProvider();
export const mockAiProvider = new MockAiProvider();
export const mockErrorReporterProvider = new MockErrorReporterProvider();
