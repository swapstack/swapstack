import type {
  AnalyticsProvider,
  BiometricProvider,
  FeatureFlagProvider,
  FileStorageProvider,
  NetworkProvider,
  NotificationProvider,
} from '@/core';
import type { BackendAdapter, BillingAdapter } from '@/lib/providers/registry';
import {
  getAnalyticsProvider,
  getBackendAdapter,
  getBillingAdapter,
  getBiometricProvider,
  getFeatureFlagProvider,
  getFileStorageProvider,
  getNetworkProvider,
  getNotificationProvider,
} from '@/lib/providers/registry';

export type { BackendAdapter, BillingAdapter };

export const serviceProviders = {
  get backend(): BackendAdapter {
    return getBackendAdapter();
  },
  get billing(): BillingAdapter {
    return getBillingAdapter();
  },
  get storage(): FileStorageProvider {
    return getFileStorageProvider();
  },
  get notifications(): NotificationProvider {
    return getNotificationProvider();
  },
  get analytics(): AnalyticsProvider {
    return getAnalyticsProvider();
  },
  get network(): NetworkProvider {
    return getNetworkProvider();
  },
  get featureFlags(): FeatureFlagProvider {
    return getFeatureFlagProvider();
  },
  get biometrics(): BiometricProvider {
    return getBiometricProvider();
  },
};
