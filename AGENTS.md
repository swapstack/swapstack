# AGENTS.md — AI Coding Agent Instructions for Swapstack

Swapstack is an Expo + React Native application built around **vendor-agnostic TypeScript contracts** for Authentication, Data, and Subscription Billing. Follow these instructions whenever adding features, modifying screens, or implementing service adapters.

---

## 1. Golden Architectural Rules

1. **Screens depend on contracts, never vendors.**
   - Route files in `src/app/` and feature modules in `src/features/` must **never** import vendor SDKs directly (such as `@supabase/supabase-js`, `react-native-purchases`, Firebase, or Clerk).
   - Screens access authentication via `useAuthSession()` from `@/features/auth/session` and data/billing via `serviceProviders` from `@/lib/services`.
2. **Local development works with zero API keys.**
   - Every contract in `src/core/` has an in-memory mock implementation in `src/core/mocks/` that runs by default (`EXPO_PUBLIC_*_PROVIDER=mock`).
   - Any new feature or screen must work end-to-end against mock providers before wiring a live vendor.
3. **Every adapter must pass the shared contract test suite.**
   - Live and mock providers alike are verified against reusable Jest contract suites in `src/core/contracts/` (`describeAuthProviderContract`, `describeDataRepositoryContract`, `describeBillingProviderContract`).
4. **Token-driven UI & design system.**
   - Use primitives from `@/components/ui` (`Button`, `Input`, `Card`, `Screen`, `Text`, `View`, `Avatar`, `Select`, `Checkbox`, `Divider`, `Toast`) and tokens from `DESIGN.md`, `src/global.css`, and `src/components/ui/colors.js`.
   - Avoid hard-coded hex colors in screen components so light and dark mode parity works automatically.

---

## 2. Repository Map

| Path | Responsibility |
| --- | --- |
| `src/core/` | Vendor-free interfaces (`auth.ts`, `data.ts`, `billing.ts`, `session-storage.ts`), domain models (`types.ts`), and typed error classes (`errors.ts`). |
| `src/core/mocks/` | In-memory mock implementations (`MockAuthProvider`, `MockDataRepository`, `MockBillingProvider`, `InMemorySessionStorage`). |
| `src/core/contracts/` | Shared Jest contract suites that every mock and live adapter must satisfy. |
| `src/lib/providers/` | Dynamic provider registry (`registry.ts`) and live vendor adapters (`supabase/`, `revenuecat/`). |
| `src/lib/services/` | Resolved singleton `serviceProviders` (`auth`, `data`, `billing`) consumed by the app. |
| `src/features/auth/` | `AuthSessionProvider`, `useAuthSession` hook, validation helpers, and reusable auth form components. |
| `src/components/ui/` | Design-system UI primitives with co-located `*.test.tsx` tests. |
| `src/app/(auth)/` | Public authentication routes (`login`, `sign-up`, `forgot-password`, `email-verification-pending`, `link-account`). |
| `src/app/(app)/` | Session-protected application routes (`index`, `profile`, `paywall`). |
| `env.ts` | Environment configuration and `validateStrictEnv()` prebuild validation. |

---

## 3. Common Workflows for Agents

### A. Adding or Modifying a Screen
1. Place public auth screens in `src/app/(auth)/` and authenticated screens in `src/app/(app)/`.
2. Compose UI from `@/components/ui` and call `useAuthSession()` or `serviceProviders`.
3. Add or update component/flow tests using `@testing-library/react-native` and the in-memory mock providers (see `src/app/(app)/__tests__/paywall.test.tsx` and `src/features/auth/__tests__/auth-flows.test.tsx`).

### B. Adding a New Provider Adapter
1. Create `src/lib/providers/<vendor>/` implementing `AuthProvider`, `DataRepository`, or `BillingProvider` from `@/core`.
2. Map vendor errors to `AuthError` or `BillingError` from `@/core/errors` and set `mode: 'live'`.
3. Register the provider factory inside `initDefaultProviders()` in `src/lib/providers/registry.ts`.
4. Add runtime credential checks in `validateProviderConfig()` (`src/lib/providers/registry.ts`) and prebuild checks in `validateStrictEnv()` (`env.ts`).
5. Create `src/lib/providers/<vendor>/__tests__/*.test.ts` and call the corresponding `describe*Contract` helper from `@/core/contracts`.

### C. Extending Core Contracts or Adding a New Service Domain
1. Define the plain TypeScript interface and types in `src/core/`.
2. Implement the in-memory mock in `src/core/mocks/`.
3. Write the reusable contract test suite in `src/core/contracts/`.
4. Register the new domain in `src/lib/providers/registry.ts` and expose it in `src/lib/services/index.ts`.

---

## 4. Verification & Git Conventions

Always run verification before finishing a task:

```sh
pnpm run lint
pnpm run type-check
pnpm test
```

- **Package manager**: Use `pnpm` exclusively (`only-allow pnpm` is enforced).
- **File naming**: Use `kebab-case` for all source and test files (`unicorn/filename-case` is enforced by ESLint).
- **TypeScript**: Prefer `type` over `interface` (`ts/consistent-type-definitions: ['error', 'type']`) and use inline type imports (`import type { ... }`).
- **Branches & Commits**: Husky hooks forbid committing directly to `main`/`master` and enforce Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
