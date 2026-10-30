import type { SupabaseClient, Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';
import { describeAuthProviderContract } from '@/core/contracts';
import { SupabaseAuthProvider } from '../auth-provider';

type MockOptions = {
  readonly requireEmailConfirmation?: boolean;
  readonly confirmLink?: boolean;
};

function createUser(values: Partial<SupabaseUser> & { readonly id: string }): SupabaseUser {
  return {
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: undefined,
    is_anonymous: false,
    ...values,
  } as SupabaseUser;
}

function createSession(user: SupabaseUser, token = `token_${user.id}`): SupabaseSession {
  return {
    access_token: token,
    expires_at: Date.now() + 3600_000,
    expires_in: 3600,
    refresh_token: `refresh_${token}`,
    token_type: 'bearer',
    user,
  } as SupabaseSession;
}

function createMockClient(options: MockOptions = {}) {
  const requireEmailConfirmation = options.requireEmailConfirmation ?? false;
  const users = new Map<string, SupabaseUser>();
  let currentSession: SupabaseSession | null = null;
  const listeners = new Set<(event: string, session: SupabaseSession | null) => void>();
  let refreshCount = 0;
  let anonymousCount = 0;
  let deleted = false;

  const notify = (session: SupabaseSession | null) => {
    for (const listener of listeners) {
      listener('SIGNED_IN', session);
    }
  };
  const activate = (session: SupabaseSession | null) => {
    currentSession = session;
    notify(session);
  };
  const requireCurrentUser = () => {
    if (!currentSession || deleted) {
      return { error: { code: 'not_authenticated', message: 'Sign in required' } };
    }
    return { user: currentSession.user };
  };

  const auth = {
    signInWithPassword: jest.fn(async ({ email, password }: { email: string; password: string }) => {
      const user = users.get(email.toLowerCase());
      if (!user) {
        return { data: { session: null, user: null }, error: { code: 'user_not_found', message: 'User not found' } };
      }
      if (password === 'wrongpassword') {
        return { data: { session: null, user: null }, error: { status: 400, message: 'Invalid credentials' } };
      }
      const session = createSession(user);
      activate(session);
      return { data: { session, user }, error: null };
    }),

    signUp: jest.fn(async ({ email, password: _password, options }: {
      email: string;
      password: string;
      options?: { data?: Record<string, unknown> };
    }) => {
      const key = email.toLowerCase();
      if (users.has(key)) {
        return { data: { session: null, user: null }, error: { code: 'user_already_exists', message: 'Duplicate user' } };
      }
      const user = createUser({
        id: `user_${users.size + 1}`,
        email,
        user_metadata: options?.data ?? {},
      });
      users.set(key, user);
      const session = createSession(user);
      activate(requireEmailConfirmation ? null : session);
      return { data: { session: requireEmailConfirmation ? null : session, user }, error: null };
    }),

    signInWithOAuth: jest.fn(async ({ provider }: { provider: string }) => {
      const user = createUser({
        id: `oauth_${provider}`,
        email: `mock_${provider}_user@example.com`,
        user_metadata: { provider },
      });
      const session = createSession(user);
      activate(session);
      return { data: { provider, session }, error: null };
    }),

    signInAnonymously: jest.fn(async () => {
      anonymousCount += 1;
      const user = createUser({ id: `guest_${anonymousCount}`, is_anonymous: true });
      const session = createSession(user);
      activate(session);
      return { data: { session, user }, error: null };
    }),

    updateUser: jest.fn(async (updates: {
      email?: string;
      password?: string;
      data?: Record<string, unknown>;
    }) => {
      const current = requireCurrentUser();
      if ('error' in current) {
        return { data: { user: null, session: null }, error: current.error };
      }
      if (updates.email && !current.user.is_anonymous) {
        return { data: { user: current.user, session: currentSession }, error: { code: 'not_anonymous' } };
      }
      const user = createUser({
        ...current.user,
        email: updates.email ?? current.user.email,
        is_anonymous: updates.email ? false : current.user.is_anonymous,
        user_metadata: updates.data ?? current.user.user_metadata ?? {},
      });
      if (updates.email) {
        users.set(updates.email.toLowerCase(), user);
      }
      const session = createSession(user, options.confirmLink === false ? `pending_${user.id}` : undefined);
      activate(options.confirmLink === false ? null : session);
      return { data: { user, session: currentSession }, error: null };
    }),

    resetPasswordForEmail: jest.fn(async () => ({ data: {}, error: null })),
    resend: jest.fn(async () => ({ data: {}, error: null })),

    signOut: jest.fn(async () => {
      activate(null);
      return { error: null };
    }),

    getSession: jest.fn(async () => ({ data: { session: currentSession }, error: null })),

    refreshSession: jest.fn(async () => {
      if (!currentSession) {
        return { data: { session: null }, error: null };
      }
      refreshCount += 1;
      const session = createSession(currentSession.user, `refreshed_${refreshCount}`);
      activate(session);
      return { data: { session }, error: null };
    }),

    onAuthStateChange: jest.fn((callback: (event: string, session: SupabaseSession | null) => void) => {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              listeners.delete(callback);
            },
          },
        },
      };
    }),
  };

  const client = {
    auth,
    rpc: jest.fn(async () => {
      deleted = true;
      if (currentSession?.user.email) {
        users.delete(currentSession.user.email.toLowerCase());
      }
      activate(null);
      return { data: null, error: null };
    }),
  };

  return { auth, client, rpc: client.rpc };
}

function createProvider(options: MockOptions = {}) {
  const mock = createMockClient(options);
  return {
    mock,
    provider: new SupabaseAuthProvider(mock.client as unknown as SupabaseClient),
  };
}

describe('supabase auth provider contract', () => {
  describeAuthProviderContract(() => createProvider().provider);
  describeAuthProviderContract(() => createProvider({ requireEmailConfirmation: true }).provider);

  it('returns null when account linking requires confirmation', async () => {
    const { provider } = createProvider({ confirmLink: false });
    await provider.signInAnonymously();
    await expect(provider.linkAccount({ email: 'linked@example.com', password: 'secretpassword' })).resolves.toBeNull();
  });

  it('rejects a wrong password with a neutral error', async () => {
    const { provider } = createProvider();
    await provider.signUp({ email: 'user@example.com', password: 'correctpassword' });
    await provider.signOut();
    await expect(provider.signIn({ email: 'user@example.com', password: 'wrongpassword' })).rejects.toMatchObject({
      code: 'invalid_credentials',
      message: 'Invalid email or password.',
    });
  });
});
