# Swapstack

Swapstack is a free Expo boilerplate with plain interfaces for auth, data, and billing, designed so apps can change service providers without rewriting their core logic. Generic mock providers are included out of the box.

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20.19.4 or higher)
- [pnpm](https://pnpm.io/) (version 10 or higher)

### Create & Run

```sh
npx create-swapstack-app my-app
cd my-app
pnpm start
```

The CLI asks for your app name and identifiers, downloads the template, configures the app, and installs dependencies.

To use the GitHub template manually instead, clone your repository, run `pnpm install`, then run `pnpm run setup`.

To run on a specific platform:

- **iOS Simulator**: `pnpm run ios`
- **Android Emulator**: `pnpm run android`
- **Expo Go**: Run `expo start --go` (or `pnpm exec expo start --go`) and scan the QR code using your device.
- **Development Client**: Run `pnpm run start` and scan the QR code using your device.

For Android native builds, use JDK 21 or a compatible Android Studio JDK. On macOS with Homebrew:

```sh
brew install openjdk@21
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
pnpm run android
```

The app runs with mock auth, data, and billing providers by default. No API keys or service projects are needed for local development.

## Switching providers

Providers are selected using environment variables in `.env`:

```sh
# Provider configuration ("mock" or "supabase" for auth/data, "mock" or "revenuecat" for billing).
EXPO_PUBLIC_AUTH_PROVIDER=mock
EXPO_PUBLIC_DATA_PROVIDER=mock
EXPO_PUBLIC_BILLING_PROVIDER=mock

# Required for Supabase. Never put a service-role key in the app.
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Required for RevenueCat. Purchases require a development build.
EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY=
```

To switch a provider, set the variable to any registered provider name. An unknown provider name throws an error at startup listing valid choices. See [Supabase setup](docs/supabase.md) before selecting `supabase`, and [RevenueCat setup](docs/revenuecat.md) before selecting `revenuecat`.

The `prebuild:*` scripts set `STRICT_ENV_VALIDATION=1`, which additionally fails the native prebuild early if a live provider is selected without its required credentials. Want to add a provider? See the adapter guide in [CONTRIBUTING.md](CONTRIBUTING.md).

## Building with AI agents

Swapstack includes a root [AGENTS.md](AGENTS.md) file that AI coding agents (Claude Code, Cursor, Antigravity, GitHub Copilot, Windsurf, and Codex) load automatically to enforce contract boundaries, design tokens, and test suites.

See [AI Agent Prompts & Workflows](docs/ai-prompts.md) for copy-paste prompts to:

- Scaffold and rebrand a new app with `create-swapstack-app`
- Build new domain features contract-first against in-memory mocks
- Implement and contract-test a new vendor adapter (Firebase, Clerk, Stripe, etc.)
- Switch from `mock` providers to live Supabase and RevenueCat adapters

Want concrete product ideas? See [Example App Blueprints](docs/examples.md) for four complete app recipes (**Pulse** Workout Tracker, **MemoStack** Flashcards, **PromptBox** AI Assistant, and **SplitLedger** Expense Splitter) with TypeScript contracts and one-prompt AI build instructions.

## What's inside

Swapstack structures core services behind vendor-agnostic contracts under `src/core`:

- **Interfaces (`src/core/`)**:
  - `AuthProvider`: email/password, OAuth and guest authentication, account linking, recovery, verification, profiles, deletion, session refresh, and auth-state subscriptions.
  - `DataRepository`: data storage and subscriptions (`get`, `update`, `subscribe`) for user profiles.
  - `BillingProvider`: entitlement-centric billing (`getOfferings`, `purchase`, `restore`, `getEntitlements`, `onEntitlementsChange`).
  - `types.ts` & `errors.ts`: vendor-free models (`User`, `Session`, `Profile`, `Offering`, `Entitlement`) and typed error classes (`AuthError`, `BillingError`).
- **Mocks (`src/core/mocks/`)**: in-memory mock implementations of all providers for local development and rapid testing without external API keys.
- **Contract tests (`src/core/contracts/`)**: reusable contract test suites that verify any provider (mock or live) complies with the required behavior.
- **Provider Registry (`src/lib/providers/`)**: dynamic registry to register and resolve service providers from configuration without touching application UI code.

## Reusing the auth kit

The `(auth)` route group contains login, sign-up, password recovery, verification-pending, and guest-upgrade screens. The `(app)` group requires a session and includes profile editing, sign-out, and account deletion. Guests can continue without an account and upgrade later from their profile.

`AuthSessionProvider` in `src/features/auth/session.tsx` restores the persisted session and subscribes to auth changes. Screens call only the `AuthProvider` exposed by `useAuthSession`, so changing registry providers does not require screen changes. Route-group layouts handle loading, restoration errors, and redirects.

To customize the kit, change the shared components in `src/features/auth/components` or compose the same provider methods in your own screens. Component and flow tests in `src/features/auth/__tests__` show how to test against `MockAuthProvider`, including confirmation-pending sign-up.

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

1. **Tokens (`DESIGN.md`, `src/global.css`, `colors.js`)**: Change theme colors (light and dark mode), typography scales, border radii, and spacing. Changes propagate throughout the entire app via Tailwind and Uniwind. Edit `--font-sans` in `src/global.css` to change the font everywhere.
2. **Components (`src/components/ui/`)**: Modify or extend core UI primitives (`Button`, `Input`, `Card`, `Screen`, `Avatar`, `Toast`, `Divider`) and their variant definitions (`tailwind-variants`).
3. **Screens & Flows (`src/app/`)**: Assemble full application screens and interaction flows by composing UI components against plain, vendor-agnostic core interfaces.

## Roadmap

Swapstack is an early work in progress. Mock providers and a live Supabase adapter (auth & data) are included; the live RevenueCat billing adapter is not implemented yet, and APIs may change. The items below are open for contribution. Adapters are the highest-leverage additions because they plug into the existing contracts without touching any screen.

### Adapters

- **RevenueCat billing** (in progress) — the first live `BillingProvider`, with a paywall and entitlement-gated screens.
- **Firebase** — auth and Firestore-backed `DataRepository`, as the most common alternative to Supabase.
- **Clerk / Auth0** — hosted auth adapters for teams already using them.
- **More OAuth providers** — the `OAuthProvider` type currently allows `apple` and `google`; GitHub, Facebook, and others are natural extensions.
- **Passwordless sign-in** — magic links and one-time codes across adapters that support them.
- **Multi-factor authentication** — TOTP enrolment and challenge flows behind the `AuthProvider` contract.

### App features

- **Paywall and subscription screens** built on `BillingProvider`, matching the existing auth kit.
- **Onboarding flow** — a reusable first-run walkthrough with a persisted "seen" flag.
- **Settings screen** — theme toggle (light / dark / system), notification preferences, and account management in one place.
- **Push notifications** — an `expo-notifications` integration with a vendor-agnostic `NotificationProvider` contract.
- **Analytics and crash reporting** — a small `AnalyticsProvider` contract with mock, PostHog, and Sentry adapters.
- **Offline support** — connectivity awareness, TanStack Query persistence, and optimistic updates for profile edits.
- **Internationalisation** — `i18n` scaffolding with a sample second locale and RTL-aware layouts.
- **Generic data entities** — `DataRepository` is currently typed to `Profile`; a list/query API would make it useful for arbitrary collections.

### Developer experience

- **Storybook** for the `src/components/ui` primitives.
- **GitHub issue and PR templates** and a `SECURITY.md` policy.
- **EAS Update** wiring for over-the-air releases.
- **More CLI options** — `--template` and `--provider` flags for `create-swapstack-app` so generated apps start with the right adapter.
- **E2E tests** with Maestro covering the auth kit flows on a simulator.

Have an idea that is not listed? Open an issue to discuss it.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, the commit and branch conventions enforced by the Git hooks, and a step-by-step guide to adding a provider adapter.

Licensed under the [MIT License](LICENSE).
