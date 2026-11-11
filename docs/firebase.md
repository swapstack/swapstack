# Firebase Adapter Guide (`firebase`)

Swapstack includes a first-party Firebase adapter for both `AuthProvider` (`src/lib/providers/firebase/auth-provider.ts`) and `DataRepository<Profile>` (`src/lib/providers/firebase/profile-repository.ts`).

## 1. Environment Variables

Configure `.env` to select the `firebase` provider:

```bash
EXPO_PUBLIC_AUTH_PROVIDER=firebase
EXPO_PUBLIC_DATA_PROVIDER=firebase

EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyYourFirebasePublicWebApiKey
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
```

## 2. Binding Your Firebase SDK Client

By default, `createFirebaseAuthProvider()` and `createFirebaseProfileRepository()` validate your environment keys and accept an injected `FirebaseAuthClient` or `FirestoreProfileClient`:

```ts
import { createFirebaseAuthProvider } from '@/lib/providers/firebase/auth-provider';
import { createFirebaseProfileRepository } from '@/lib/providers/firebase/profile-repository';
import { register } from '@/lib/providers/registry';

register('auth', 'firebase', () =>
  createFirebaseAuthProvider({
    client: myFirebaseAuthBridge,
  }),);

register('data', 'firebase', () =>
  createFirebaseProfileRepository(myFirestoreProfileBridge),);
```

## 3. Contract Verification

Both adapters are verified against the shared Swapstack contract suites:
- `src/lib/providers/firebase/__tests__/auth-provider.test.ts` (`describeAuthProviderContract`)
- `src/lib/providers/firebase/__tests__/profile-repository.test.ts` (`describeDataRepositoryContract`)
