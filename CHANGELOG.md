# Changelog

## 0.2.1 — 2026-11-11

### Added

- Root `AGENTS.md` AI coding agent instructions, prompt library (`docs/ai-prompts.md`), example app blueprints (`docs/examples.md`), and curated light color theme + UI design style presets (`docs/themes.md`).
- Interactive documentation & theme/design preview site at `https://swapstack.github.io/swapstack/` and refreshed app icons.

### Fixed

- `create-swapstack-app` now strips template website files (`site/`, `.github/workflows/pages.yml`) and renames `AGENTS.md` with the generated app's display name.

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
