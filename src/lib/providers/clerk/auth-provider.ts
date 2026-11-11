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

export type ClerkUserResource = {
  readonly id: string;
  readonly primaryEmailAddress?: string | null;
  readonly fullName?: string | null;
  readonly imageUrl?: string | null;
  readonly isAnonymous?: boolean;
  readonly unsafeMetadata?: Record<string, unknown>;
};

export type ClerkSessionResource = {
  readonly id: string;
  readonly token: string;
  readonly refreshToken?: string;
  readonly expireAt?: number;
  readonly user: ClerkUserResource;
};

export type ClerkErrorPayload = {
  readonly code?: string;
  readonly message: string;
};

export type ClerkResult<T> = {
  readonly data: T | null;
  readonly error: ClerkErrorPayload | null;
};

export type ClerkAuthClient = {
  readonly signIn: (
    email: string,
    password: string,
  ) => Promise<ClerkResult<ClerkSessionResource>>;
  readonly signUp: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ) => Promise<ClerkResult<ClerkSessionResource | null>>;
  readonly signInWithOAuth: (
    strategy: OAuthProvider,
  ) => Promise<ClerkResult<ClerkSessionResource>>;
  readonly signInAnonymously: () => Promise<ClerkResult<ClerkSessionResource>>;
  readonly linkAccount: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ) => Promise<ClerkResult<ClerkSessionResource | null>>;
  readonly requestPasswordReset: (email: string) => Promise<{ readonly error: ClerkErrorPayload | null }>;
  readonly resendVerification: (email: string) => Promise<{ readonly error: ClerkErrorPayload | null }>;
  readonly updateUser: (
    updates: {
      readonly fullName?: string;
      readonly imageUrl?: string;
      readonly unsafeMetadata?: Record<string, unknown>;
    },
  ) => Promise<ClerkResult<ClerkUserResource>>;
  readonly deleteUser: () => Promise<{ readonly error: ClerkErrorPayload | null }>;
  readonly refreshSession: () => Promise<ClerkResult<ClerkSessionResource>>;
  readonly signOut: () => Promise<{ readonly error: ClerkErrorPayload | null }>;
  readonly getSession: () => Promise<ClerkResult<ClerkSessionResource>>;
  readonly addListener: (
    listener: (session: ClerkSessionResource | null) => void,
  ) => Unsubscribe;
};

export type ClerkAuthProviderOptions = {
  readonly publishableKey?: string;
  readonly client?: ClerkAuthClient;
};

function mapUser(user: ClerkUserResource): User {
  return {
    id: user.id,
    email: user.primaryEmailAddress ? user.primaryEmailAddress : undefined,
    displayName: user.fullName ?? undefined,
    avatarUrl: user.imageUrl ?? undefined,
    isAnonymous: Boolean(user.isAnonymous),
    metadata: user.unsafeMetadata,
  };
}

function mapSession(session: ClerkSessionResource): Session {
  return {
    token: session.token,
    expiresAt: session.expireAt,
    user: mapUser(session.user),
  };
}

function mapErrorCode(error: ClerkErrorPayload): AuthErrorCode | undefined {
  const code = (error.code ?? '').toLowerCase();
  const message = error.message.toLowerCase();
  if (code.includes('form_identifier_exists') || message.includes('already exists') || message.includes('already registered')) {
    return 'user_already_exists';
  }
  if (code.includes('form_identifier_not_found') || message.includes('not found')) {
    return 'user_not_found';
  }
  if (code.includes('form_password_incorrect') || message.includes('invalid password')) {
    return 'invalid_credentials';
  }
  if (code.includes('not_anonymous') || message.includes('not anonymous')) {
    return 'not_anonymous';
  }
  if (code.includes('authentication_invalid') || code.includes('not_authenticated') || message.includes('not authenticated')) {
    return 'not_authenticated';
  }
  if (code.includes('form_param_format_invalid') || message.includes('invalid email')) {
    return 'invalid_email';
  }
  return undefined;
}

function mapError(
  error: ClerkErrorPayload | null | undefined,
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

export function createClerkAuthClient(options: ClerkAuthProviderOptions = {}): ClerkAuthClient {
  const publishableKey = options.publishableKey ?? process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey || publishableKey.trim() === '') {
    throw new AuthError(
      'Clerk publishable key missing. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.',
    );
  }

  let currentSession: ClerkSessionResource | null = null;
  const listeners = new Set<(session: ClerkSessionResource | null) => void>();

  const notify = (session: ClerkSessionResource | null) => {
    currentSession = session;
    listeners.forEach((listener) => {
      listener(session);
    });
  };

  const unconfigured = async <T>(): Promise<ClerkResult<T>> => ({
    data: null,
    error: {
      code: 'clerk_client_not_bound',
      message: 'Bind your Clerk SDK client via createClerkAuthProvider({ client }).',
    },
  });

  return {
    signIn: () => unconfigured(),
    signUp: () => unconfigured(),
    signInWithOAuth: () => unconfigured(),
    signInAnonymously: () => unconfigured(),
    linkAccount: () => unconfigured(),
    requestPasswordReset: async () => ({ error: null }),
    resendVerification: async () => ({ error: null }),
    updateUser: () => unconfigured(),
    deleteUser: async () => {
      notify(null);
      return { error: null };
    },
    refreshSession: async () => ({ data: currentSession, error: null }),
    signOut: async () => {
      notify(null);
      return { error: null };
    },
    getSession: async () => ({ data: currentSession, error: null }),
    addListener: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export class ClerkAuthProvider implements AuthProvider {
  readonly mode = 'live' as const;

  constructor(readonly client: ClerkAuthClient = createClerkAuthClient()) {}

  signIn = async (credentials: SignInCredentials): Promise<Session> => {
    validateEmail(credentials.email);
    const { data, error } = await this.client.signIn(
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
    const { data, error } = await this.client.signUp(
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
    const { data, error } = await this.client.linkAccount(
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
    const { error } = await this.client.requestPasswordReset(email);
    if (error) {
      throw mapError(error, 'Unable to send reset instructions.');
    }
  };

  resendVerification = async (email: string): Promise<void> => {
    validateEmail(email);
    const { error } = await this.client.resendVerification(email);
    if (error) {
      throw mapError(error, 'Unable to resend verification email.');
    }
  };

  updateProfile = async (updates: ProfileUpdate): Promise<User> => {
    const { data, error } = await this.client.updateUser({
      fullName: updates.displayName,
      imageUrl: updates.avatarUrl,
      unsafeMetadata: updates.metadata,
    });
    if (error || !data) {
      throw mapError(error, 'Unable to update profile.', 'not_authenticated');
    }
    return mapUser(data);
  };

  deleteAccount = async (): Promise<void> => {
    const { error } = await this.client.deleteUser();
    if (error) {
      throw mapError(error, 'Unable to delete account.');
    }
    await this.signOut();
  };

  refreshSession = async (): Promise<Session | null> => {
    const { data, error } = await this.client.refreshSession();
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
    const { data, error } = await this.client.getSession();
    if (error || !data) {
      return null;
    }
    return mapSession(data);
  };

  onAuthChange = (callback: (session: Session | null) => void): Unsubscribe => {
    return this.client.addListener((session) => {
      try {
        callback(session ? mapSession(session) : null);
      }
      catch (error) {
        console.warn('Clerk auth listener threw an error:', error);
      }
    });
  };
}

export function createClerkAuthProvider(
  options: ClerkAuthProviderOptions = {},
): ClerkAuthProvider {
  return new ClerkAuthProvider(options.client ?? createClerkAuthClient(options));
}
