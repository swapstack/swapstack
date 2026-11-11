# Clerk Adapter Guide (`clerk`)

Swapstack includes a first-party Clerk adapter implementing `AuthProvider` (`src/lib/providers/clerk/auth-provider.ts`). You can pair Clerk authentication with any `DataRepository<Profile>` provider (`supabase`, `firebase`, or `mock`).

## 1. Environment Variables

Configure `.env` to select `clerk` for authentication:

```bash
EXPO_PUBLIC_AUTH_PROVIDER=clerk
EXPO_PUBLIC_DATA_PROVIDER=supabase

EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
```

## 2. Binding Your Clerk SDK Client

Pass your `@clerk/clerk-expo` bridge into `createClerkAuthProvider({ client })`:

```ts
import { createClerkAuthProvider } from '@/lib/providers/clerk/auth-provider';
import { register } from '@/lib/providers/registry';

register('auth', 'clerk', () =>
  createClerkAuthProvider({
    client: myClerkBridge,
  }),);
```

## 3. Contract Verification

`ClerkAuthProvider` is verified against the shared `describeAuthProviderContract` suite in `src/lib/providers/clerk/__tests__/auth-provider.test.ts`.
