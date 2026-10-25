import type { BackendAdapter, BillingAdapter } from '@/lib/providers/registry';
import { getBackendAdapter, getBillingAdapter } from '@/lib/providers/registry';

export type { BackendAdapter, BillingAdapter };

export const serviceProviders = {
  get backend(): BackendAdapter {
    return getBackendAdapter();
  },
  get billing(): BillingAdapter {
    return getBillingAdapter();
  },
};
