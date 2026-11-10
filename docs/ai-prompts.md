# AI Agent Prompts & Workflows

Swapstack is structured so AI coding agents (Claude Code, Cursor, Antigravity, GitHub Copilot, Windsurf, and Codex) can scaffold apps, build features against in-memory mocks, and swap in live backend adapters without leaking vendor SDKs into application screens.

 Every app generated with `create-swapstack-app` includes a root [AGENTS.md](../AGENTS.md) file that agents automatically read for architectural boundaries, file locations, and test commands.

Below are ready-to-paste prompts for the four most common agent workflows.

---

## 1. Scaffold & Customize a New App

Use this prompt in an empty workspace or terminal session to have your AI agent scaffold a new Swapstack app, customize the brand tokens, and build your first authenticated screens.

```text
Create a new Expo app using Swapstack and customize it for my product:

1. Run `npx create-swapstack-app <app-dir> --name "<App Name>" --bundle-id <com.company.app> --yes` and `cd` into the project.
2. Read `AGENTS.md` and `DESIGN.md` to understand the contract architecture and token system.
3. Update the brand tokens in `DESIGN.md`, `src/global.css`, and `src/components/ui/colors.js` to match our brand palette while preserving light and dark mode contrast.
4. Update the home screen in `src/app/(app)/index.tsx` using primitives from `@/components/ui` (`Screen`, `Card`, `Button`, `Text`, `View`), keeping navigation links to `/profile` and `/paywall`.
5. Keep all providers on `mock` in `.env` so everything runs without external API keys.
6. Add or update tests in `src/app/(app)/__tests__/index.test.tsx` and verify that `pnpm run lint`, `pnpm run type-check`, and `pnpm test` pass.
```

---

## 2. Build a New Feature Contract-First

Use this prompt when adding a new domain feature (such as notes, workouts, tasks, or bookmarks) so your agent builds the contract, in-memory mock, contract tests, and UI screen in lockstep.

```text
Build a new "<Feature Name>" feature in this Swapstack app following the contract-first architecture in `AGENTS.md`:

1. Contract & Types (`src/core/`):
   - Define vendor-free TypeScript `type` definitions and repository methods in `src/core/` (do not import any vendor SDKs).
2. In-Memory Mock (`src/core/mocks/`):
   - Implement an in-memory mock adapter with deterministic state, subscription cleanup, and reset support for tests.
3. Contract Test Suite (`src/core/contracts/`):
   - Write a reusable `describe<Feature>Contract` Jest suite in `src/core/contracts/` and run it against the mock adapter in `src/core/__tests__/`.
4. Registry & Services (`src/lib/providers/` & `src/lib/services/`):
   - Register the `mock` adapter in `src/lib/providers/registry.ts` and expose it on `serviceProviders`.
5. Screen & Flow Tests (`src/app/(app)/`):
   - Build the UI screen in `src/app/(app)/` using `@/components/ui` primitives and only calling `serviceProviders`.
   - Write React Native Testing Library tests in `src/app/(app)/__tests__/` against the mock provider.
6. Run `pnpm run lint`, `pnpm run type-check`, and `pnpm test` and fix any issues.
```

---

## 3. Add a New Vendor Adapter (Firebase, Clerk, Stripe, etc.)

Use this prompt when you want an AI agent to add a new backend or billing provider behind Swapstack's existing `AuthProvider`, `DataRepository`, or `BillingProvider` contracts.

```text
Implement a `<vendor>` adapter for `<auth | data | billing>` in Swapstack without modifying any screen in `src/app/`:

1. Read `AGENTS.md`, `CONTRIBUTING.md`, and the existing adapter in `src/lib/providers/supabase/` (or `src/lib/providers/revenuecat/`) as a reference implementation.
2. Create `src/lib/providers/<vendor>/` implementing the contract from `@/core` (`AuthProvider`, `DataRepository`, or `BillingProvider`) with `mode: 'live'`.
3. Map all vendor-specific errors to `AuthError` or `BillingError` from `@/core/errors` so existing screens handle error codes uniformly.
4. Register `<vendor>` inside `initDefaultProviders()` in `src/lib/providers/registry.ts`.
5. Add runtime credential validation in `validateProviderConfig()` (`src/lib/providers/registry.ts`) and prebuild validation in `validateStrictEnv()` (`env.ts`), and document the new env vars in `.env.example` and `docs/<vendor>.md`.
6. Create `src/lib/providers/<vendor>/__tests__/` and run the shared contract test suite (`describeAuthProviderContract`, `describeDataRepositoryContract`, or `describeBillingProviderContract`) from `@/core/contracts` against a mocked vendor SDK client.
7. Verify `pnpm run lint`, `pnpm run type-check`, and `pnpm test` pass.
```

---

## 4. Switch from Mocks to Live Supabase & RevenueCat

Use this prompt when you are ready to connect your Swapstack app to live Supabase and RevenueCat projects for preview or production builds.

```text
Help me switch this Swapstack app from `mock` providers to live `supabase` and `revenuecat` adapters:

1. Read `docs/supabase.md`, `docs/revenuecat.md`, and `env.ts`.
2. Check my `.env` file and list the exact environment variables needed for:
   - `EXPO_PUBLIC_AUTH_PROVIDER=supabase`
   - `EXPO_PUBLIC_DATA_PROVIDER=supabase`
   - `EXPO_PUBLIC_BILLING_PROVIDER=revenuecat`
3. Output the Supabase SQL migration and RLS policies from `docs/supabase.md` that I need to run in the Supabase SQL Editor for the `public.profiles` table.
4. Verify that `STRICT_ENV_VALIDATION=1` passes with my configuration and that no screen files in `src/app/` needed to change.
5. Run `pnpm run lint`, `pnpm run type-check`, and `pnpm test`.
```
