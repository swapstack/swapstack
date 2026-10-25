# Swapstack

Swapstack is a free Expo boilerplate where Supabase and RevenueCat sit behind swappable adapters, so apps can change service providers without rewriting their core logic.

## Quick start

1. On GitHub, select **Use this template** to create your own repository.
2. Install dependencies, create your local configuration, and start Expo:

```sh
pnpm install
cp .env.example .env
pnpm start
```

The app runs with mock Supabase and RevenueCat providers by default. No API keys or service projects are needed for local development.

## Rename your app

Run `pnpm rename-app` and enter your app name and bundle ID. The command updates the values below, `package.json`, this README's title, and your local `.env` when it exists.

| Field | Purpose |
| --- | --- |
| `APP_NAME` | Display name shown on the device |
| `APP_SLUG` | Expo project slug |
| `APP_SCHEME` | Deep-link URL scheme |
| `IOS_BUNDLE_ID` | Unique Apple bundle identifier |
| `ANDROID_PACKAGE` | Unique Android application ID |

The iOS bundle ID and Android package name must be globally unique and cannot be changed after the first store release. Choose them carefully before publishing.

For live builds and services, you need your own Expo/EAS project, Supabase project, and RevenueCat project. Do not reuse Swapstack's project identifiers or credentials.

## Planned stack

- Expo, React Native, and Expo Router
- TypeScript
- Uniwind and Tailwind CSS
- TanStack Query and MMKV storage
- Jest and React Native Testing Library
- Supabase and RevenueCat behind swappable adapters

## Work in progress

Swapstack is an early work in progress. Only mock service providers are included; live Supabase and RevenueCat adapters are not implemented yet, and APIs may change.

Licensed under the [MIT License](LICENSE).
