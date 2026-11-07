# Contributing to Swapstack

Thanks for helping improve Swapstack. This guide covers local setup, the conventions the repo enforces, and the most valuable kind of contribution: a new provider adapter.

## Prerequisites

- [Node.js](https://nodejs.org/) 20.19.4 or higher
- [pnpm](https://pnpm.io/) 10 or higher (the repo refuses other package managers via `only-allow`)
- For native builds: Xcode (iOS) and/or Android Studio with JDK 21 (Android)

## Local setup

```sh
git clone https://github.com/swapstack/swapstack.git
cd swapstack
pnpm install
pnpm start
```

The app runs against in-memory mock providers by default, so no API keys or external services are needed to develop and test. Copy `.env.example` to `.env` only when you want to exercise a live provider such as Supabase (see [docs/supabase.md](docs/supabase.md)).

## Running checks

Run the full suite before opening a pull request. It is the same set of checks CI runs:

```sh
pnpm check-all
```

That runs, in order: `lint`, `type-check`, `test`, and the `create-swapstack-app` CLI build and tests. You can also run them individually:

| Command | What it does |
| --- | --- |
| `pnpm lint` / `pnpm lint:fix` | ESLint over the repo |
| `pnpm type-check` | `tsc --noEmit` |
| `pnpm test` / `pnpm test:watch` | Jest and React Native Testing Library |
| `npx tsx scripts/test-cli.ts` | Builds and tests `packages/create-swapstack-app` |

## Git conventions

These are enforced by Husky hooks, so it helps to know them up front.

- **Never commit directly to `main`.** The pre-commit hook rejects commits on `main`/`master`. Work on a feature branch.
- **Pre-commit** runs `type-check` and `lint-staged` (ESLint `--fix` on staged `.js/.jsx/.ts/.tsx/.json` files). Fix anything it reports rather than skipping the hook.
- **Conventional Commits** are required. The commit-msg hook runs commitlint with `@commitlint/config-conventional`. Use a type prefix such as `feat:`, `fix:`, `docs:`, `test:`, `chore:`, or `refactor:`, for example:

  ```
  feat: add Firebase auth adapter
  fix: handle expired refresh tokens in session restore
  docs: document billing provider setup
  ```

## Project layout

The architecture is built around vendor-agnostic contracts so screens never depend on a specific service:

| Path | Purpose |
| --- | --- |
| `src/core/` | The plain interfaces (`AuthProvider`, `DataRepository`, `BillingProvider`), shared types, and typed errors. No vendor code lives here. |
| `src/core/mocks/` | In-memory implementations used for local development and tests. |
| `src/core/contracts/` | Reusable Jest contract suites that any adapter must pass. |
| `src/lib/providers/` | The registry that maps provider names from env vars to implementations. |
| `src/lib/providers/<vendor>/` | A live adapter for one vendor (for example `supabase/`). |
| `src/features/` | Feature modules such as the auth kit (screens, components, session provider). |
| `src/components/ui/` | Design-system primitives. Tokens live in `DESIGN.md` and `src/global.css`. |
| `src/app/` | Expo Router routes. `(auth)` is public; `(app)` requires a session. |
| `packages/create-swapstack-app/` | The `npx create-swapstack-app` CLI. |

## Adding a provider adapter

Adapters are the main extension point. A good adapter adds a vendor without touching any screen. To add one, say `acme` for auth:

1. **Implement the contract.** Create `src/lib/providers/acme/auth-provider.ts` that returns an object satisfying `AuthProvider` from `src/core/auth.ts`. Map vendor errors to the typed errors in `src/core/errors.ts` so screens can handle them uniformly. Set `mode: 'live'`.
2. **Register it.** In `src/lib/providers/registry.ts`, add a `register('auth', 'acme', () => ...)` call inside `initDefaultProviders()`. The name is what users put in `EXPO_PUBLIC_AUTH_PROVIDER`.
3. **Run the contract tests.** Add `src/lib/providers/acme/__tests__/auth-provider.test.ts` and call `describeAuthProviderContract` from `@/core/contracts` against a mocked vendor client. The Supabase adapter tests are a good template. The same pattern applies to `describeDataRepositoryContract` and `describeBillingProviderContract`.
4. **Validate configuration.** If the adapter needs credentials, add the check to `validateProviderConfig()` in `registry.ts` (runtime) and to `validateStrictEnv()` in `env.ts` (prebuild, when `STRICT_ENV_VALIDATION` is set) so misconfiguration fails early with a clear message.
5. **Document it.** Add the required variables to `.env.example`, write `docs/acme.md` modelled on `docs/supabase.md`, and mention the new provider name in the README "Switching providers" section.
6. **Keep the generated app clean.** If the adapter pulls in template-only files or scripts, check `packages/create-swapstack-app` so they are excluded from generated apps.

## Adding a UI component

Place new primitives in `src/components/ui/` with a co-located `*.test.tsx`. Use the design tokens from `DESIGN.md` and `src/global.css` rather than hard-coded colors so light/dark mode and rebranding keep working. Variants should use `tailwind-variants`, following the existing `Button` and `Input` components.

## Pull requests

1. Open an issue first for anything beyond a small fix so the approach can be discussed.
2. Keep PRs focused on one change. Separate refactors from behaviour changes.
3. Make sure `pnpm check-all` passes and add tests for new behaviour.
4. Update docs (`README.md`, `docs/`, `CHANGELOG.md`) when the change is user-facing.
5. Describe what changed, why, and how you tested it in the PR description.

## Reporting bugs and requesting features

Use [GitHub issues](https://github.com/swapstack/swapstack/issues). For bugs, include your platform (iOS, Android, or web), the provider configuration you are using, and steps to reproduce. For security issues, please do not open a public issue; contact the maintainer directly instead.

## License

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).
