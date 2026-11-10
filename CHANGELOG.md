# Changelog

## 0.2.0 — 2026-11-10

### Added

- Supabase auth and profile data providers (`EXPO_PUBLIC_AUTH_PROVIDER=supabase`, `EXPO_PUBLIC_DATA_PROVIDER=supabase`).
- RevenueCat billing provider (`EXPO_PUBLIC_BILLING_PROVIDER=revenuecat`) with customer info and package offering fetching.
- Reusable subscription paywall screen (`/paywall`) with package selection, purchase flows, and restore purchases.
- Native build environment validation (`STRICT_ENV_VALIDATION=1`) with adapter configuration guides.

## 0.1.1 — 2026-10-30

### Added

- Reusable authentication screens, session gates, guest access, and profile management.
- Provider contracts for auth, profile data, and billing, with mock implementations and session storage.
- CLI cleanup for generated app metadata, branding, storage keys, mock email namespaces, and internal test scripts.

### Fixed

- Root provider setup, splash handling, native font registration, and light/dark theme output.
- Generated apps no longer retain template-only packages, metadata, or invalid `check-all` commands.
- Storage no longer converts stored `false`, `0`, or empty strings to `null`.
- MMKV test mocks now support `remove`.
