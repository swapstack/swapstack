import type {
  AuthProvider,
  LinkAccountCredentials,
  OAuthProvider,
  ProfileUpdate,
  SignInCredentials,
  SignUpCredentials,
} from '@/core/auth';
import type { AuthErrorCode } from '@/core/errors';
import type {
  Session,
  Unsubscribe,
  User,
} from '@/core/types';
import { AuthError } from '@/core/errors';

export type FirebaseUserRecord = {
  readonly uid: string;
  readonly email?: string | null;
  readonly displayName?: string | null;
  readonly photoURL?: string | null;
  readonly isAnonymous?: boolean;
  readonly metadata?: Record<string, unknown>;
};

export type FirebaseSessionRecord = {
  readonly idToken: string;
  readonly refreshToken?: string;
  readonly expiresAt?: number;
  readonly user: FirebaseUserRecord;
};

export type FirebaseErrorPayload = {
  readonly code?: string;
  readonly message: string;
};

export type FirebaseAuthResult<T> = {
  readonly data: T | null;
  readonly error: FirebaseErrorPayload | null;
};

export type FirebaseAuthClient = {
  readonly signInWithEmailAndPassword: (
    email: string,
    password: string,
  ) => Promise<FirebaseAuthResult<FirebaseSessionRecord>>;
  readonly createUserWithEmailAndPassword: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ) => Promise<FirebaseAuthResult<FirebaseSessionRecord | null>>;
  readonly signInWithOAuth: (
    provider: OAuthProvider,
  ) => Promise<FirebaseAuthResult<FirebaseSessionRecord>>;
  readonly signInAnonymously: () => Promise<FirebaseAuthResult<FirebaseSessionRecord>>;
  readonly linkWithCredential: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ) => Promise<FirebaseAuthResult<FirebaseSessionRecord | null>>;
  readonly sendPasswordResetEmail: (email: string) => Promise<{ readonly error: FirebaseErrorPayload | null }>;
  readonly sendEmailVerification: (email: string) => Promise<{ readonly error: FirebaseErrorPayload | null }>;
  readonly updateCurrentUserProfile: (
    updates: {
      readonly displayName?: string;
      readonly photoURL?: string;
      readonly metadata?: Record<string, unknown>;
    },
  ) => Promise<FirebaseAuthResult<FirebaseUserRecord>>;
  readonly deleteCurrentUser: () => Promise<{ readonly error: FirebaseErrorPayload | null }>;
  readonly refreshCurrentSession: () => Promise<FirebaseAuthResult<FirebaseSessionRecord>>;
  readonly signOut: () => Promise<{ readonly error: FirebaseErrorPayload | null }>;
  readonly getCurrentSession: () => Promise<FirebaseAuthResult<FirebaseSessionRecord>>;
  readonly onAuthStateChanged: (
    listener: (session: FirebaseSessionRecord | null) => void,
  ) => Unsubscribe;
};

export type FirebaseAuthProviderOptions = {
  readonly apiKey?: string;
  readonly projectId?: string;
  readonly client?: FirebaseAuthClient;
};

function mapUser(user: FirebaseUserRecord): User {
  return {
    id: user.uid,
    email: user.email ? user.email : undefined,
    displayName: user.displayName ?? undefined,
    avatarUrl: user.photoURL ?? undefined,
    isAnonymous: Boolean(user.isAnonymous),
    metadata: user.metadata,
  };
}

function mapSession(session: FirebaseSessionRecord): Session {
  return {
    token: session.idToken,
    expiresAt: session.expiresAt,
    user: mapUser(session.user),
  };
}

function mapErrorCode(error: FirebaseErrorPayload): AuthErrorCode | undefined {
  const code = (error.code ?? '').toLowerCase();
  const message = error.message.toLowerCase();
  if (code.includes('email-already-in-use') || message.includes('email_exists') || message.includes('already registered')) {
    return 'user_already_exists';
  }
  if (code.includes('user-not-found') || message.includes('email_not_found') || message.includes('user not found')) {
    return 'user_not_found';
  }
  if (code.includes('wrong-password') || code.includes('invalid-credential') || message.includes('invalid_login_credentials')) {
    return 'invalid_credentials';
  }
  if (code.includes('not-anonymous') || message.includes('not anonymous')) {
    return 'not_anonymous';
  }
  if (code.includes('unauthenticated') || code.includes('requires-recent-login') || message.includes('not authenticated')) {
    return 'not_authenticated';
  }
  if (code.includes('invalid-email') || message.includes('invalid email')) {
    return 'invalid_email';
  }
  return undefined;
}

function mapError(
  error: FirebaseErrorPayload | null | undefined,
  fallbackMessage = 'Authentication request failed.',
  fallbackCode?: AuthErrorCode,
): AuthError {
  if (!error) {
    return new AuthError(fallbackMessage, fallbackCode);
  }
  return new AuthError(error.message || fallbackMessage, mapErrorCode(error) ?? fallbackCode);
}

function validateEmail(email: string): void {
  if (!email || email.trim() === '') {
    throw new AuthError('Email address is required.', 'invalid_email');
  }
}

export function createFirebaseAuthClient(options: FirebaseAuthProviderOptions = {}): FirebaseAuthClient {
  const apiKey = options.apiKey ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new AuthError(
      'Firebase credentials missing. Set EXPO_PUBLIC_FIREBASE_API_KEY and EXPO_PUBLIC_FIREBASE_PROJECT_ID.',
    );
  }

  let currentSession: FirebaseSessionRecord | null = null;
  const listeners = new Set<(session: FirebaseSessionRecord | null) => void>();

  const notify = (session: FirebaseSessionRecord | null) => {
    currentSession = session;
    listeners.forEach((listener) => {
      listener(session);
    });
  };

  const unconfigured = async <T>(): Promise<FirebaseAuthResult<T>> => ({
    data: null,
    error: {
      code: 'firebase/client-not-bound',
      message: 'Bind your Firebase Auth SDK client via createFirebaseAuthProvider({ client }).',
    },
  });

  return {
    signInWithEmailAndPassword: () => unconfigured(),
    createUserWithEmailAndPassword: () => unconfigured(),
    signInWithOAuth: () => unconfigured(),
    signInAnonymously: () => unconfigured(),
    linkWithCredential: () => unconfigured(),
    sendPasswordResetEmail: async () => ({ error: null }),
    sendEmailVerification: async () => ({ error: null }),
    updateCurrentUserProfile: () => unconfigured(),
    deleteCurrentUser: async () => {
      notify(null);
      return { error: null };
    },
    refreshCurrentSession: async () => ({ data: currentSession, error: null }),
    signOut: async () => {
      notify(null);
      return { error: null };
    },
    getCurrentSession: async () => ({ data: currentSession, error: null }),
    onAuthStateChanged: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export class FirebaseAuthProvider implements AuthProvider {
  readonly mode = 'live' as const;

  constructor(readonly client: FirebaseAuthClient = createFirebaseAuthClient()) {}

  signIn = async (credentials: SignInCredentials): Promise<Session> => {
    validateEmail(credentials.email);
    const { data, error } = await this.client.signInWithEmailAndPassword(
      credentials.email,
      credentials.password,
    );
    if (error || !data) {
      throw mapError(error, 'Invalid email or password.');
    }
    return mapSession(data);
  };

  signUp = async (credentials: SignUpCredentials): Promise<Session | null> => {
    validateEmail(credentials.email);
    const { data, error } = await this.client.createUserWithEmailAndPassword(
      credentials.email,
      credentials.password,
      credentials.metadata,
    );
    if (error) {
      throw mapError(error);
    }
    return data ? mapSession(data) : null;
  };

  signInWithOAuth = async (provider: OAuthProvider): Promise<Session> => {
    const { data, error } = await this.client.signInWithOAuth(provider);
    if (error || !data) {
      throw mapError(error, 'Complete OAuth sign-in in the opened browser.');
    }
    return mapSession(data);
  };

  signInAnonymously = async (): Promise<Session> => {
    const { data, error } = await this.client.signInAnonymously();
    if (error || !data) {
      throw mapError(error, 'Unable to create a guest session.');
    }
    return mapSession(data);
  };

  linkAccount = async (credentials: LinkAccountCredentials): Promise<Session | null> => {
    validateEmail(credentials.email);
    const { data, error } = await this.client.linkWithCredential(
      credentials.email,
      credentials.password,
      credentials.metadata,
    );
    if (error) {
      throw mapError(error);
    }
    return data ? mapSession(data) : null;
  };

  requestPasswordReset = async (email: string): Promise<void> => {
    validateEmail(email);
    const { error } = await this.client.sendPasswordResetEmail(email);
    if (error) {
      throw mapError(error, 'Unable to send reset instructions.');
    }
  };

  resendVerification = async (email: string): Promise<void> => {
    validateEmail(email);
    const { error } = await this.client.sendEmailVerification(email);
    if (error) {
      throw mapError(error, 'Unable to resend verification email.');
    }
  };

  updateProfile = async (updates: ProfileUpdate): Promise<User> => {
    const { data, error } = await this.client.updateCurrentUserProfile({
      displayName: updates.displayName,
      photoURL: updates.avatarUrl,
      metadata: updates.metadata,
    });
    if (error || !data) {
      throw mapError(error, 'Unable to update profile.', 'not_authenticated');
    }
    return mapUser(data);
  };

  deleteAccount = async (): Promise<void> => {
    const { error } = await this.client.deleteCurrentUser();
    if (error) {
      throw mapError(error, 'Unable to delete account.');
    }
    await this.signOut();
  };

  refreshSession = async (): Promise<Session | null> => {
    const { data, error } = await this.client.refreshCurrentSession();
    if (error || !data) {
      return null;
    }
    return mapSession(data);
  };

  signOut = async (): Promise<void> => {
    const { error } = await this.client.signOut();
    if (error) {
      throw mapError(error, 'Unable to sign out.');
    }
  };

  getSession = async (): Promise<Session | null> => {
    const { data, error } = await this.client.getCurrentSession();
    if (error || !data) {
      return null;
    }
    return mapSession(data);
  };

  onAuthChange = (callback: (session: Session | null) => void): Unsubscribe => {
    return this.client.onAuthStateChanged((session) => {
      try {
        callback(session ? mapSession(session) : null);
      }
      catch (error) {
        console.warn('Firebase auth listener threw an error:', error);
      }
    });
  };
}

export function createFirebaseAuthProvider(
  options: FirebaseAuthProviderOptions = {},
): FirebaseAuthProvider {
  return new FirebaseAuthProvider(options.client ?? createFirebaseAuthClient(options));
}
