import type {
  AiProvider,
  AnalyticsProvider,
  BiometricProvider,
  ErrorReporterProvider,
  FeatureFlagProvider,
  FileStorageProvider,
  I18nProvider,
  NetworkProvider,
  NotificationProvider,
} from '@/core';
import type { BackendAdapter, BillingAdapter } from '@/lib/providers/registry';
import {
  getAiProvider,
  getAnalyticsProvider,
  getBackendAdapter,
  getBillingAdapter,
  getBiometricProvider,
  getErrorReporterProvider,
  getFeatureFlagProvider,
  getFileStorageProvider,
  getI18nProvider,
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
  get ai(): AiProvider {
    return getAiProvider();
  },
  get errorReporter(): ErrorReporterProvider {
    return getErrorReporterProvider();
  },
  get i18n(): I18nProvider {
    return getI18nProvider();
  },
};
