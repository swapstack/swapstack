# RevenueCat setup

Swapstack includes a RevenueCat billing adapter behind the standard `BillingProvider` contract. The paywall works with the mock provider without keys and with RevenueCat in a development build.

## 1. Create a RevenueCat project

Create a project in RevenueCat and configure:

1. At least one entitlement, such as `pro`.
2. App Store Connect and/or Google Play products.
3. An offering with packages mapped to those products.

## 2. Configure the app

Set these values in `.env`:

```sh
EXPO_PUBLIC_BILLING_PROVIDER=revenuecat
EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY=your-public-sdk-key
```

Use the **public SDK key** shown in RevenueCat project settings. Do not use a secret or private API key.

## 3. Create a development build

RevenueCat runs in Expo Go preview mode, but real purchases require native StoreKit or Google Play Billing code. Create a development build before testing purchases:

```sh
pnpm expo prebuild
pnpm ios
# or
pnpm android
```

For store testing, configure the relevant sandbox or license-test user and verify the app/entity identifiers in the stores.

## 4. Test the paywall

Start the app and open **View plans**. The paywall loads offerings, purchases packages, restores purchases, and reflects entitlement changes through the provider listener.

## Notes

- Offering identifiers exposed to the UI are RevenueCat package identifiers.
- Purchase cancellation is mapped to the shared `cancelled` billing error and remains on the paywall.
- Entitlements are entitlement identifiers from RevenueCat, not store product IDs.
