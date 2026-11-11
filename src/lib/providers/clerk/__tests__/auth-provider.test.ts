import type {
  ClerkAuthClient,
  ClerkSessionResource,
  ClerkUserResource,
} from '../auth-provider';
import { describeAuthProviderContract } from '@/core/contracts/auth-provider.contract';
import { createClerkAuthProvider } from '../auth-provider';

type StoredClerkUser = {
  readonly password?: string;
  readonly record: ClerkUserResource;
};

function createFakeClerkClient(): ClerkAuthClient {
  const usersByEmail = new Map<string, StoredClerkUser>();
  let currentSession: ClerkSessionResource | null = null;
  let counter = 0;
  const listeners = new Set<(session: ClerkSessionResource | null) => void>();

  const nextId = (prefix: string) => {
    counter += 1;
    return `${prefix}_${counter}`;
  };

  const emit = (session: ClerkSessionResource | null) => {
    currentSession = session;
    listeners.forEach((listener) => {
      listener(session);
    });
  };

  const makeSession = (user: ClerkUserResource): ClerkSessionResource => ({
    id: nextId('clerk_sess'),
    token: nextId('clerk_jwt'),
    refreshToken: nextId('clerk_refresh'),
    expireAt: Math.floor(Date.now() / 1000) + 3600,
    user,
  });

  return {
    signUp: jest.fn(async (email, password, metadata) => {
      if (usersByEmail.has(email)) {
        return {
          data: null,
          error: { code: 'form_identifier_exists', message: 'That email address is taken.' },
        };
      }
      const user: ClerkUserResource = {
        id: nextId('clerk_user'),
        primaryEmailAddress: email,
        isAnonymous: false,
        unsafeMetadata: metadata,
      };
      usersByEmail.set(email, { password, record: user });
      const session = makeSession(user);
      emit(session);
      return { data: session, error: null };
    }),
    signIn: jest.fn(async (email, password) => {
      const existing = usersByEmail.get(email);
      if (!existing) {
        return {
          data: null,
          error: { code: 'form_identifier_not_found', message: 'Couldn\'t find your account.' },
        };
      }
      if (existing.password !== password) {
        return {
          data: null,
          error: { code: 'form_password_incorrect', message: 'Password is incorrect.' },
        };
      }
      const session = makeSession(existing.record);
      emit(session);
      return { data: session, error: null };
    }),
    signInWithOAuth: jest.fn(async (provider) => {
      const user: ClerkUserResource = {
        id: nextId('clerk_oauth'),
        primaryEmailAddress: `${provider}@swapstack.org`,
        fullName: `${provider.toUpperCase()} User`,
        isAnonymous: false,
      };
      const session = makeSession(user);
      emit(session);
      return { data: session, error: null };
    }),
    signInAnonymously: jest.fn(async () => {
      const user: ClerkUserResource = {
        id: nextId('clerk_anon'),
        primaryEmailAddress: null,
        isAnonymous: true,
      };
      const session = makeSession(user);
      emit(session);
      return { data: session, error: null };
    }),
    linkAccount: jest.fn(async (email, password, metadata) => {
      if (!currentSession) {
        return {
          data: null,
          error: { code: 'not_authenticated', message: 'Not authenticated' },
        };
      }
      if (!currentSession.user.isAnonymous) {
        return {
          data: null,
          error: { code: 'not_anonymous', message: 'Current user is not anonymous' },
        };
      }
      const upgraded: ClerkUserResource = {
        ...currentSession.user,
        primaryEmailAddress: email,
        isAnonymous: false,
        unsafeMetadata: { ...currentSession.user.unsafeMetadata, ...metadata },
      };
      usersByEmail.set(email, { password, record: upgraded });
      const session = makeSession(upgraded);
      emit(session);
      return { data: session, error: null };
    }),
    requestPasswordReset: jest.fn(async () => ({ error: null })),
    resendVerification: jest.fn(async () => ({ error: null })),
    updateUser: jest.fn(async (updates) => {
      if (!currentSession) {
        return {
          data: null,
          error: { code: 'not_authenticated', message: 'Not authenticated' },
        };
      }
      const updatedUser: ClerkUserResource = {
        ...currentSession.user,
        fullName: updates.fullName ?? currentSession.user.fullName,
        imageUrl: updates.imageUrl ?? currentSession.user.imageUrl,
        unsafeMetadata: updates.unsafeMetadata
          ? { ...currentSession.user.unsafeMetadata, ...updates.unsafeMetadata }
          : currentSession.user.unsafeMetadata,
      };
      currentSession = { ...currentSession, user: updatedUser };
      return { data: updatedUser, error: null };
    }),
    deleteUser: jest.fn(async () => {
      if (!currentSession) {
        return {
          error: { code: 'not_authenticated', message: 'Not authenticated' },
        };
      }
      if (currentSession.user.primaryEmailAddress) {
        usersByEmail.delete(currentSession.user.primaryEmailAddress);
      }
      return { error: null };
    }),
    refreshSession: jest.fn(async () => {
      if (!currentSession) {
        return { data: null, error: null };
      }
      const refreshed = makeSession(currentSession.user);
      currentSession = refreshed;
      return { data: refreshed, error: null };
    }),
    signOut: jest.fn(async () => {
      emit(null);
      return { error: null };
    }),
    getSession: jest.fn(async () => ({ data: currentSession, error: null })),
    addListener: jest.fn((listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }),
  };
}

describe('clerkAuthProvider', () => {
  describeAuthProviderContract(() =>
    createClerkAuthProvider({ client: createFakeClerkClient() }),
  );

  it('throws when publishableKey is missing', () => {
    const prevKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
    delete process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
    try {
      expect(() => createClerkAuthProvider({ publishableKey: '' })).toThrow(
        'Clerk publishable key missing.',
      );
    }
    finally {
      process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = prevKey;
    }
  });
});
