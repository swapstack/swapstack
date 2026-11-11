import type {
  FirebaseAuthClient,
  FirebaseSessionRecord,
  FirebaseUserRecord,
} from '../auth-provider';
import { describeAuthProviderContract } from '@/core/contracts/auth-provider.contract';
import { createFirebaseAuthProvider } from '../auth-provider';

type StoredUser = {
  readonly password?: string;
  readonly record: FirebaseUserRecord;
};

function createFakeFirebaseClient(): FirebaseAuthClient {
  const usersByEmail = new Map<string, StoredUser>();
  let currentSession: FirebaseSessionRecord | null = null;
  let counter = 0;
  const listeners = new Set<(session: FirebaseSessionRecord | null) => void>();

  const nextId = (prefix: string) => {
    counter += 1;
    return `${prefix}_${counter}`;
  };

  const emit = (session: FirebaseSessionRecord | null) => {
    currentSession = session;
    listeners.forEach((listener) => {
      listener(session);
    });
  };

  const makeSession = (user: FirebaseUserRecord): FirebaseSessionRecord => ({
    idToken: nextId('fb_id_token'),
    refreshToken: nextId('fb_refresh_token'),
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    user,
  });

  return {
    signUp: undefined as never,
    createUserWithEmailAndPassword: jest.fn(async (email, password, metadata) => {
      if (usersByEmail.has(email)) {
        return {
          data: null,
          error: { code: 'auth/email-already-in-use', message: 'EMAIL_EXISTS' },
        };
      }
      const user: FirebaseUserRecord = {
        uid: nextId('fb_user'),
        email,
        isAnonymous: false,
        metadata,
      };
      usersByEmail.set(email, { password, record: user });
      const session = makeSession(user);
      emit(session);
      return { data: session, error: null };
    }),
    signInWithEmailAndPassword: jest.fn(async (email, password) => {
      const existing = usersByEmail.get(email);
      if (!existing) {
        return {
          data: null,
          error: { code: 'auth/user-not-found', message: 'EMAIL_NOT_FOUND' },
        };
      }
      if (existing.password !== password) {
        return {
          data: null,
          error: { code: 'auth/wrong-password', message: 'INVALID_LOGIN_CREDENTIALS' },
        };
      }
      const session = makeSession(existing.record);
      emit(session);
      return { data: session, error: null };
    }),
    signInWithOAuth: jest.fn(async (provider) => {
      const user: FirebaseUserRecord = {
        uid: nextId('fb_oauth'),
        email: `${provider}@swapstack.org`,
        displayName: `${provider.toUpperCase()} User`,
        isAnonymous: false,
      };
      const session = makeSession(user);
      emit(session);
      return { data: session, error: null };
    }),
    signInAnonymously: jest.fn(async () => {
      const user: FirebaseUserRecord = {
        uid: nextId('fb_anon'),
        email: null,
        isAnonymous: true,
      };
      const session = makeSession(user);
      emit(session);
      return { data: session, error: null };
    }),
    linkWithCredential: jest.fn(async (email, password, metadata) => {
      if (!currentSession) {
        return {
          data: null,
          error: { code: 'auth/unauthenticated', message: 'Not authenticated' },
        };
      }
      if (!currentSession.user.isAnonymous) {
        return {
          data: null,
          error: { code: 'auth/not-anonymous', message: 'Current user is not anonymous' },
        };
      }
      const upgraded: FirebaseUserRecord = {
        ...currentSession.user,
        email,
        isAnonymous: false,
        metadata: { ...currentSession.user.metadata, ...metadata },
      };
      usersByEmail.set(email, { password, record: upgraded });
      const session = makeSession(upgraded);
      emit(session);
      return { data: session, error: null };
    }),
    sendPasswordResetEmail: jest.fn(async () => ({ error: null })),
    sendEmailVerification: jest.fn(async () => ({ error: null })),
    updateCurrentUserProfile: jest.fn(async (updates) => {
      if (!currentSession) {
        return {
          data: null,
          error: { code: 'auth/unauthenticated', message: 'Not authenticated' },
        };
      }
      const updatedUser: FirebaseUserRecord = {
        ...currentSession.user,
        displayName: updates.displayName ?? currentSession.user.displayName,
        photoURL: updates.photoURL ?? currentSession.user.photoURL,
        metadata: updates.metadata
          ? { ...currentSession.user.metadata, ...updates.metadata }
          : currentSession.user.metadata,
      };
      currentSession = { ...currentSession, user: updatedUser };
      return { data: updatedUser, error: null };
    }),
    deleteCurrentUser: jest.fn(async () => {
      if (!currentSession) {
        return {
          error: { code: 'auth/unauthenticated', message: 'Not authenticated' },
        };
      }
      if (currentSession.user.email) {
        usersByEmail.delete(currentSession.user.email);
      }
      return { error: null };
    }),
    refreshCurrentSession: jest.fn(async () => {
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
    getCurrentSession: jest.fn(async () => ({ data: currentSession, error: null })),
    onAuthStateChanged: jest.fn((listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }),
  } as FirebaseAuthClient;
}

describe('firebaseAuthProvider', () => {
  describeAuthProviderContract(() =>
    createFirebaseAuthProvider({ client: createFakeFirebaseClient() }),
  );

  it('throws when apiKey is missing', () => {
    const prevKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    delete process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    try {
      expect(() => createFirebaseAuthProvider({ apiKey: '' })).toThrow(
        'Firebase credentials missing.',
      );
    }
    finally {
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY = prevKey;
    }
  });
});
