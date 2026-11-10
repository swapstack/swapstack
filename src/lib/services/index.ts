import type { AnalyticsProvider, FileStorageProvider, NotificationProvider } from '@/core';
import type { BackendAdapter, BillingAdapter } from '@/lib/providers/registry';
import {
  getAnalyticsProvider,
  getBackendAdapter,
  getBillingAdapter,
  getFileStorageProvider,
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
};
