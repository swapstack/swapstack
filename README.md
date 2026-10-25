# Swapstack

Swapstack is a free Expo boilerplate with plain interfaces for auth, data, and billing, designed so apps can change service providers without rewriting their core logic. Generic mock providers are included out of the box.

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20.19.4 or higher)
- [pnpm](https://pnpm.io/) (version 10 or higher)

### Setup & Run

Select **Use this template** on GitHub, clone your repository, then run:

```sh
pnpm install
pnpm run setup
pnpm run start
```

`pnpm run setup` asks for your app name and bundle ID, renames the app, and creates `.env`.

To run on a specific platform:

- **iOS Simulator**: `pnpm run ios`
- **Android Emulator**: `pnpm run android`
- **Expo Go**: Run `expo start --go` (or `pnpm exec expo start --go`) and scan the QR code using your device.
- **Development Client**: Run `pnpm run start` and scan the QR code using your device.

The app runs with mock auth, data, and billing providers by default. No API keys or service projects are needed for local development.

## Switching providers

Providers are selected using environment variables in `.env`:

```sh
# Provider configuration (currently accepts only "mock").
EXPO_PUBLIC_AUTH_PROVIDER=mock
EXPO_PUBLIC_DATA_PROVIDER=mock
EXPO_PUBLIC_BILLING_PROVIDER=mock
```

To switch a provider, set the variable to any registered provider name (currently `"mock"` is bundled). An unknown provider name throws an error at startup listing valid choices.

## What's inside

Swapstack structures core services behind vendor-agnostic contracts under `src/core`:

- **Interfaces (`src/core/`)**:
  - `AuthProvider`: plain authentication (`signIn`, `signUp`, `signInWithOAuth`, `signOut`, `getSession`, `onAuthChange`).
  - `DataRepository`: data storage and subscriptions (`get`, `update`, `subscribe`) for user profiles.
  - `BillingProvider`: entitlement-centric billing (`getOfferings`, `purchase`, `restore`, `getEntitlements`, `onEntitlementsChange`).
  - `types.ts` & `errors.ts`: vendor-free models (`User`, `Session`, `Profile`, `Offering`, `Entitlement`) and typed error classes (`AuthError`, `BillingError`).
- **Mocks (`src/core/mocks/`)**: in-memory mock implementations of all providers for local development and rapid testing without external API keys.
- **Contract tests (`src/core/contracts/`)**: reusable contract test suites that verify any provider (mock or live) complies with the required behavior.
- **Provider Registry (`src/lib/providers/`)**: dynamic registry to register and resolve service providers from configuration without touching application UI code.

## Rename your app

Run `pnpm run rename-app` and enter your app name and bundle ID. The command updates the values below, `package.json`, this README's title, and your local `.env` when it exists.

| Field | Purpose |
| --- | --- |
| `APP_NAME` | Display name shown on the device |
| `APP_SLUG` | Expo project slug |
| `APP_SCHEME` | Deep-link URL scheme |
| `IOS_BUNDLE_ID` | Unique Apple bundle identifier |
| `ANDROID_PACKAGE` | Unique Android application ID |

The iOS bundle ID and Android package name must be globally unique and cannot be changed after the first store release. Choose them carefully before publishing.

For live builds and services, you need your own Expo/EAS project, Supabase project, and RevenueCat project. Do not reuse Swapstack's project identifiers or credentials.

## Stack

- Expo (v54), React Native, and Expo Router
- TypeScript
- Uniwind and Tailwind CSS
- TanStack Query and MMKV storage
- Jest and React Native Testing Library
- Plain interfaces in `src/core` with generic mock providers
- Swappable provider registry in `src/lib/providers`

## Design system

Design rules live in `DESIGN.md`. Change the tokens to rebrand.

The design system and token definitions were generated and structured with help from the [Impeccable](https://github.com/pbakaus/impeccable) design skill (licensed under Apache-2.0). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for details.

### Customizing the design

Swapstack's design system is structured across three levels of customization:

1. **Tokens (`DESIGN.md`, `src/global.css`, `colors.js`)**: Change theme colors (light and dark mode), typography scales, border radii, and spacing. Changes propagate throughout the entire app via Tailwind and Uniwind.
2. **Components (`src/components/ui/`)**: Modify or extend core UI primitives (`Button`, `Input`, `Card`, `Screen`, `Avatar`, `Toast`, `Divider`) and their variant definitions (`tailwind-variants`).
3. **Screens & Flows (`src/app/`)**: Assemble full application screens and interaction flows by composing UI components against plain, vendor-agnostic core interfaces.

## Planned

- Live Supabase adapter (auth & data)
- Live RevenueCat adapter (billing & entitlements)

## Work in progress

Swapstack is an early work in progress. Only mock service providers are included; live Supabase and RevenueCat adapters are not implemented yet, and APIs may change.

Licensed under the [MIT License](LICENSE).
