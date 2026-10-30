import type {
  CustomerInfo,
  MakePurchaseResult,
  PurchasesOffering,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';
import { describeBillingProviderContract } from '@/core/contracts';
import { createRevenueCatBillingProvider } from '../billing-provider';

type EntitlementMap = Record<string, { identifier: string; expirationDate: string | null }>;

function createPackage(identifier: string, title: string, priceString: string): PurchasesPackage {
  return {
    identifier,
    packageType: 'CUSTOM',
    product: {
      identifier,
      title,
      description: `${title} access`,
      priceString,
    },
    offeringIdentifier: 'pro',
  } as unknown as PurchasesPackage;
}

function createOffering(packages: PurchasesPackage[]): PurchasesOffering {
  return {
    identifier: 'pro',
    serverDescription: 'Pro access',
    metadata: {},
    availablePackages: packages,
  } as unknown as PurchasesOffering;
}

function createCustomerInfo(active: EntitlementMap): CustomerInfo {
  return {
    entitlements: {
      active,
    },
  } as unknown as CustomerInfo;
}

function createMockSdk() {
  const packages = [
    createPackage('pro_monthly', 'Pro Monthly', '$4.99/mo'),
    createPackage('pro_annual', 'Pro Annual', '$39.99/yr'),
    createPackage('cancelled', 'Cancelled Purchase', '$0.00'),
  ];
  const listeners = new Set<(customerInfo: CustomerInfo) => void>();
  let active: EntitlementMap = {};

  const notify = () => {
    const customerInfo = createCustomerInfo(active);
    for (const listener of listeners) {
      listener(customerInfo);
    }
  };

  const sdk = {
    configure: jest.fn(),
    PURCHASES_ERROR_CODE: {
      PURCHASE_CANCELLED_ERROR: '1',
    },
    getOfferings: jest.fn(async () => ({
      all: { pro: createOffering(packages) },
      current: createOffering(packages),
    } as PurchasesOfferings)),
    purchasePackage: jest.fn(async (pkg: PurchasesPackage): Promise<MakePurchaseResult> => {
      if (pkg.identifier === 'cancelled') {
        const error = new Error('Cancelled') as Error & { code: string; userCancelled: boolean };
        error.code = '1';
        error.userCancelled = true;
        throw error;
      }
      active = {
        pro: { identifier: 'pro', expirationDate: null },
      };
      notify();
      return {
        productIdentifier: pkg.product.identifier,
        customerInfo: createCustomerInfo(active),
      } as MakePurchaseResult;
    }),
    restorePurchases: jest.fn(async () => createCustomerInfo(active)),
    getCustomerInfo: jest.fn(async () => createCustomerInfo(active)),
    addCustomerInfoUpdateListener: jest.fn((listener: (customerInfo: CustomerInfo) => void) => {
      listeners.add(listener);
    }),
    removeCustomerInfoUpdateListener: jest.fn((listener: (customerInfo: CustomerInfo) => void) => {
      listeners.delete(listener);
      return true;
    }),
  };

  return sdk;
}

describe('revenuecat billing provider contract', () => {
  describeBillingProviderContract(() => createRevenueCatBillingProvider({
    apiKey: 'test-key',
    sdk: createMockSdk() as never,
  }));

  it('maps packages to the shared offering model', async () => {
    const sdk = createMockSdk();
    const provider = createRevenueCatBillingProvider({ apiKey: 'test-key', sdk: sdk as never });
    const offerings = await provider.getOfferings();

    expect(offerings).toEqual([
      expect.objectContaining({ id: 'pro_monthly', title: 'Pro Monthly', price: '$4.99/mo', entitlementId: 'pro' }),
      expect.objectContaining({ id: 'pro_annual', title: 'Pro Annual', price: '$39.99/yr', entitlementId: 'pro' }),
      expect.objectContaining({ id: 'cancelled', title: 'Cancelled Purchase', price: '$0.00', entitlementId: 'pro' }),
    ]);
    expect(sdk.configure).toHaveBeenCalledWith({ apiKey: 'test-key' });
  });

  it('maps purchase cancellation to the shared cancelled error', async () => {
    const provider = createRevenueCatBillingProvider({
      apiKey: 'test-key',
      sdk: createMockSdk() as never,
    });

    await expect(provider.purchase('cancelled')).rejects.toMatchObject({
      code: 'cancelled',
    });
  });
});
