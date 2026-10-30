import type { SupabaseClient, Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';
import type {
  LinkAccountCredentials,
  OAuthProvider,
  ProfileUpdate,
  SignInCredentials,
  SignUpCredentials,
} from '@/core/auth';
import type { Session, Unsubscribe, User } from '@/core/types';
import {
  createClient,
} from '@supabase/supabase-js';
import { AuthError } from '@/core/errors';
import { SupabaseTokenStorage } from '@/lib/auth/supabase-token-storage';

export type SupabaseAuthProviderOptions = {
  readonly client?: SupabaseClient;
  readonly url?: string;
  readonly anonKey?: string;
};

function requireSupabaseConfig(url?: string, anonKey?: string) {
  const resolvedUrl = url ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  const resolvedKey = anonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!resolvedUrl?.trim() || !resolvedKey?.trim()) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return { url: resolvedUrl.trim(), anonKey: resolvedKey.trim() };
}

export function createSupabaseClient(options: SupabaseAuthProviderOptions = {}): SupabaseClient {
  const { url, anonKey } = requireSupabaseConfig(options.url, options.anonKey);
  return createClient(url, anonKey, {
    auth: {
      storage: new SupabaseTokenStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

function mapUser(user: SupabaseUser): User {
  const metadata = { ...(user.user_metadata ?? {}) } as Record<string, unknown>;
  delete metadata.displayName;
  delete metadata.avatarUrl;
  return {
    id: user.id,
    email: user.email ?? undefined,
    createdAt: user.created_at,
    displayName: typeof user.user_metadata?.displayName === 'string' ? user.user_metadata.displayName : undefined,
    avatarUrl: typeof user.user_metadata?.avatarUrl === 'string' ? user.user_metadata.avatarUrl : undefined,
    isAnonymous: Boolean((user as { is_anonymous?: boolean }).is_anonymous),
    metadata,
  };
}

function mapSession(session: SupabaseSession): Session {
  const expiresAt = session.expires_at;
  return {
    token: session.access_token,
    user: mapUser(session.user),
    expiresAt: typeof expiresAt === 'number'
      ? expiresAt
      : expiresAt
        ? Date.parse(expiresAt)
        : undefined,
  };
}

function mapError(error: unknown, fallback = 'Something went wrong. Please try again.'): AuthError {
  if (error instanceof AuthError) {
    return error;
  }
  const details = error as { status?: number; code?: string; message?: string } | null;
  if (details?.status === 400 || details?.code === 'invalid_credentials') {
    return new AuthError('Invalid email or password.', 'invalid_credentials');
  }
  if (details?.code === 'user_not_found') {
    return new AuthError('Invalid email or password.', 'user_not_found');
  }
  if (details?.code === 'user_already_exists') {
    return new AuthError('An account with this email already exists.', 'user_already_exists');
  }
  if (details?.code === 'invalid_email') {
    return new AuthError('Enter a valid email address.', 'invalid_email');
  }
  if (details?.code === 'not_anonymous') {
    return new AuthError('You already have an account.', 'not_anonymous');
  }
  if (details?.code === 'not_authenticated') {
    return new AuthError('Sign in to continue.', 'not_authenticated');
  }
  return new AuthError(fallback);
}

function requireData<T>(data: T | null, error: unknown, fallback: string): T {
  if (error) {
    throw mapError(error, fallback);
  }
  if (data === null || data === undefined) {
    throw new AuthError(fallback);
  }
  return data;
}

function validateEmail(email: string): void {
  if (!email.trim()) {
    throw new AuthError('Enter a valid email address.', 'invalid_email');
  }
}

function mapProfileUpdate(updates: ProfileUpdate): Record<string, unknown> {
  const { metadata, ...profile } = updates;
  return { ...profile, ...(metadata ?? {}) };
}

export class SupabaseAuthProvider {
  readonly mode = 'live' as const;

  constructor(readonly client: SupabaseClient = createSupabaseClient()) {}

  signIn = async (credentials: SignInCredentials): Promise<Session> => {
    validateEmail(credentials.email);
    const { data, error } = await this.client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    return mapSession(requireData(data.session, error, 'Invalid email or password.'));
  };

  signUp = async (credentials: SignUpCredentials): Promise<Session | null> => {
    validateEmail(credentials.email);
    const { data, error } = await this.client.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: { data: credentials.metadata },
    });
    if (error) {
      throw mapError(error);
    }
    return data.session ? mapSession(data.session) : null;
  };

  signInWithOAuth = async (provider: OAuthProvider): Promise<Session> => {
    const { data, error } = await this.client.auth.signInWithOAuth({ provider });
    if (error) {
      throw mapError(error);
    }
    const session = (data as { session?: SupabaseSession | null }).session;
    if (!session) {
      throw new AuthError('Complete OAuth sign-in in the opened browser.');
    }
    return mapSession(session);
  };

  signInAnonymously = async (): Promise<Session> => {
    const { data, error } = await this.client.auth.signInAnonymously();
    return mapSession(requireData(data.session, error, 'Unable to create a guest session.'));
  };

  linkAccount = async (credentials: LinkAccountCredentials): Promise<Session | null> => {
    validateEmail(credentials.email);
    const { data, error } = await this.client.auth.updateUser({
      email: credentials.email,
      password: credentials.password,
      data: credentials.metadata,
    });
    if (error) {
      throw mapError(error);
    }
    const session = (data as { session?: SupabaseSession | null }).session;
    return session ? mapSession(session) : null;
  };

  requestPasswordReset = async (email: string): Promise<void> => {
    validateEmail(email);
    const { error } = await this.client.auth.resetPasswordForEmail(email);
    if (error) {
      throw mapError(error, 'Unable to send reset instructions.');
    }
  };

  resendVerification = async (email: string): Promise<void> => {
    validateEmail(email);
    const { error } = await this.client.auth.resend({ type: 'signup', email });
    if (error) {
      throw mapError(error, 'Unable to resend verification email.');
    }
  };

  updateProfile = async (updates: ProfileUpdate): Promise<User> => {
    const { data, error } = await this.client.auth.updateUser({ data: mapProfileUpdate(updates) });
    if (error || !data.user) {
      throw mapError(error, 'Unable to update profile.');
    }
    return mapUser(data.user);
  };

  deleteAccount = async (): Promise<void> => {
    const { error } = await this.client.rpc('delete_current_user');
    if (error) {
      throw mapError(error, 'Unable to delete account.');
    }
    await this.signOut();
  };

  refreshSession = async (): Promise<Session | null> => {
    const { data, error } = await this.client.auth.refreshSession();
    if (error) {
      return null;
    }
    return data.session ? mapSession(data.session) : null;
  };

  signOut = async (): Promise<void> => {
    const { error } = await this.client.auth.signOut();
    if (error) {
      throw mapError(error, 'Unable to sign out.');
    }
  };

  getSession = async (): Promise<Session | null> => {
    const { data, error } = await this.client.auth.getSession();
    if (error || !data.session) {
      return null;
    }
    return mapSession(data.session);
  };

  onAuthChange = (callback: (session: Session | null) => void): Unsubscribe => {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      try {
        callback(session ? mapSession(session) : null);
      }
      catch (error) {
        console.warn('Supabase auth listener threw an error:', error);
      }
    });
    return () => {
      data.subscription.unsubscribe();
    };
  };
}

export function createSupabaseAuthProvider(options: SupabaseAuthProviderOptions = {}): SupabaseAuthProvider {
  return new SupabaseAuthProvider(options.client ?? createSupabaseClient(options));
}
