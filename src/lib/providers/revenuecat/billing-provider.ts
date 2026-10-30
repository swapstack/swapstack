import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';
import type { BillingProvider, EntitlementsChangeCallback } from '@/core/billing';
import type { Entitlement, Offering, Unsubscribe } from '@/core/types';
import Purchases from 'react-native-purchases';
import { BillingError } from '@/core/errors';

type RevenueCatSdk = Pick<typeof Purchases, 'configure' | 'getOfferings' | 'purchasePackage' | 'restorePurchases' | 'getCustomerInfo' | 'addCustomerInfoUpdateListener' | 'removeCustomerInfoUpdateListener'> & {
  readonly PURCHASES_ERROR_CODE?: { readonly PURCHASE_CANCELLED_ERROR?: string };
};

export type RevenueCatBillingProviderOptions = {
  readonly sdk?: RevenueCatSdk;
  readonly apiKey?: string;
};

function requireApiKey(apiKey?: string): string {
  const key = apiKey ?? process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY;
  if (!key?.trim()) {
    throw new Error('Missing EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY.');
  }
  return key.trim();
}

function mapOfferings(offerings: PurchasesOfferings): Offering[] {
  return Object.values(offerings.all).flatMap((offering: PurchasesOffering) =>
    offering.availablePackages.map((pkg: PurchasesPackage) => ({
      id: pkg.identifier,
      title: pkg.product.title || offering.identifier,
      description: pkg.product.description || offering.serverDescription,
      price: pkg.product.priceString,
      entitlementId: offering.identifier,
    })),
  );
}

function mapEntitlements(customerInfo: CustomerInfo): Entitlement[] {
  return Object.values(customerInfo.entitlements.active).map(info => ({
    id: info.identifier,
    isActive: true,
    expirationDate: info.expirationDate,
  }));
}

function mapError(error: unknown, sdk: RevenueCatSdk): BillingError {
  const details = error as { code?: string; userCancelled?: boolean | null; message?: string } | null;
  const cancelledCode = sdk.PURCHASES_ERROR_CODE?.PURCHASE_CANCELLED_ERROR;
  if (details?.userCancelled || (cancelledCode && details?.code === cancelledCode)) {
    return new BillingError('Purchase was cancelled by the user.', 'cancelled');
  }
  return new BillingError('Unable to complete purchase.', 'purchase_failed');
}

export class RevenueCatBillingProvider implements BillingProvider {
  readonly mode = 'live' as const;

  constructor(private readonly sdk: RevenueCatSdk = Purchases) {}

  getOfferings = async (): Promise<Offering[]> => {
    const offerings = await this.sdk.getOfferings();
    return mapOfferings(offerings);
  };

  purchase = async (offeringId: string): Promise<Entitlement[]> => {
    const offerings = await this.sdk.getOfferings();
    const target = Object.values(offerings.all)
      .flatMap(offering => offering.availablePackages)
      .find(pkg => pkg.identifier === offeringId);
    if (!target) {
      throw new BillingError('Offering not found.', 'offering_not_found');
    }

    try {
      const result = await this.sdk.purchasePackage(target);
      return mapEntitlements(result.customerInfo);
    }
    catch (error) {
      throw mapError(error, this.sdk);
    }
  };

  restore = async (): Promise<Entitlement[]> => {
    const customerInfo = await this.sdk.restorePurchases();
    return mapEntitlements(customerInfo);
  };

  getEntitlements = async (): Promise<Entitlement[]> => {
    const customerInfo = await this.sdk.getCustomerInfo();
    return mapEntitlements(customerInfo);
  };

  onEntitlementsChange = (callback: EntitlementsChangeCallback): Unsubscribe => {
    const listener = (customerInfo: CustomerInfo) => {
      try {
        callback(mapEntitlements(customerInfo));
      }
      catch (error) {
        console.warn('RevenueCat billing listener threw an error:', error);
      }
    };
    this.sdk.addCustomerInfoUpdateListener(listener);
    return () => {
      this.sdk.removeCustomerInfoUpdateListener(listener);
    };
  };
}

export function createRevenueCatBillingProvider(options: RevenueCatBillingProviderOptions = {}): RevenueCatBillingProvider {
  const sdk = options.sdk ?? Purchases;
  sdk.configure({ apiKey: requireApiKey(options.apiKey) });
  return new RevenueCatBillingProvider(sdk);
}
