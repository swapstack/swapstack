import type {
  AuthProvider,
  AuthStateChangeCallback,
  LinkAccountCredentials,
  OAuthProvider,
  ProfileUpdate,
  SignInCredentials,
  SignUpCredentials,
} from '../auth';
import type { SessionStorage } from '../session-storage';
import type { Session, Unsubscribe, User } from '../types';
import { withAuthRetry } from '../auth-retry';
import { AuthError } from '../errors';
import { InMemorySessionStorage } from './in-memory-session-storage';

type MockAuthOptions = {
  readonly storage?: SessionStorage;
  readonly requireEmailConfirmation?: boolean;
};

export class MockAuthProvider implements AuthProvider {
  readonly mode = 'mock' as const;
  private currentSession: Session | null;
  private readonly users = new Map<string, User>();
  private readonly listeners = new Set<AuthStateChangeCallback>();
  private readonly storage: SessionStorage;
  private readonly requireEmailConfirmation: boolean;
  private tokenCounter = 0;
  private userCounter = 0;

  constructor(
    initialSession: Session | null = null,
    initialUsers: readonly User[] = [],
    options: MockAuthOptions = {},
  ) {
    this.storage = options.storage ?? new InMemorySessionStorage();
    this.requireEmailConfirmation = options.requireEmailConfirmation ?? false;
    this.currentSession = initialSession ? structuredClone(initialSession) : null;
    for (const user of initialUsers) {
      this.users.set(this.userKey(user), structuredClone(user));
    }
    if (initialSession?.user) {
      this.users.set(this.userKey(initialSession.user), structuredClone(initialSession.user));
    }
  }

  readonly signIn = async (credentials: SignInCredentials): Promise<Session> => {
    const email = this.validateEmail(credentials.email);
    const user = this.users.get(email.toLowerCase());

    if (!user) {
      throw new AuthError(`User not found: ${email}`, 'user_not_found');
    }

    return this.createSession(user);
  };

  readonly signUp = async (credentials: SignUpCredentials): Promise<Session | null> => {
    const email = this.validateEmail(credentials.email);
    const key = email.toLowerCase();

    if (this.users.has(key)) {
      throw new AuthError(`User already exists: ${email}`, 'user_already_exists');
    }

    const user = this.createUser({
      email,
      metadata: structuredClone(credentials.metadata),
      isAnonymous: false,
    });
    this.users.set(key, structuredClone(user));
    return this.requireEmailConfirmation ? null : this.createSession(user);
  };

  readonly signInWithOAuth = async (provider: OAuthProvider): Promise<Session> => {
    const email = `mock_${provider}_user@swapstack.org`;
    const key = email.toLowerCase();
    let user = this.users.get(key);

    if (!user) {
      user = this.createUser({ email, metadata: { provider }, isAnonymous: false });
      this.users.set(key, structuredClone(user));
    }

    return this.createSession(user);
  };

  readonly signInAnonymously = async (): Promise<Session> => {
    const user = this.createUser({ isAnonymous: true });
    this.users.set(this.userKey(user), structuredClone(user));
    return this.createSession(user);
  };

  readonly linkAccount = async (credentials: LinkAccountCredentials): Promise<Session | null> => {
    return withAuthRetry(async () => {
      const session = await this.requireSession();
      if (!session.user.isAnonymous) {
        throw new AuthError('Current account is not anonymous', 'not_anonymous');
      }

      const email = this.validateEmail(credentials.email);
      const key = email.toLowerCase();
      if (this.users.has(key)) {
        throw new AuthError(`User already exists: ${email}`, 'user_already_exists');
      }

      const user: User = {
        ...session.user,
        email,
        isAnonymous: false,
        metadata: structuredClone(credentials.metadata ?? session.user.metadata),
      };
      this.replaceUser(session.user, user);

      if (this.requireEmailConfirmation) {
        await this.clearSessionState();
        return null;
      }

      return this.persistSession({ ...session, user });
    }, () => this.refreshSession());
  };

  readonly requestPasswordReset = async (email: string): Promise<void> => {
    this.validateEmail(email);
  };

  readonly resendVerification = async (email: string): Promise<void> => {
    this.validateEmail(email);
  };

  readonly updateProfile = async (updates: ProfileUpdate): Promise<User> => {
    return withAuthRetry(async () => {
      const session = await this.requireSession();
      const user: User = {
        ...session.user,
        ...structuredClone(updates),
      };
      this.replaceUser(session.user, user);
      await this.persistSession({ ...session, user });
      return structuredClone(user);
    }, () => this.refreshSession());
  };

  readonly deleteAccount = async (): Promise<void> => {
    return withAuthRetry(async () => {
      const session = await this.requireSession();
      this.users.delete(this.userKey(session.user));
      await this.clearSessionState();
    }, () => this.refreshSession());
  };

  readonly refreshSession = async (): Promise<Session | null> => {
    const session = this.currentSession ?? await this.storage.getSession();
    return session ? this.createSession(session.user) : null;
  };

  readonly signOut = async (): Promise<void> => {
    await this.clearSessionState();
  };

  readonly getSession = async (): Promise<Session | null> => {
    const session = this.currentSession ?? await this.storage.getSession();
    if (session?.expiresAt !== undefined && session.expiresAt <= Date.now()) {
      await this.clearSessionState();
      return null;
    }

    this.currentSession = session ? structuredClone(session) : null;
    return session ? structuredClone(session) : null;
  };

  readonly onAuthChange = (callback: AuthStateChangeCallback): Unsubscribe => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  readonly reset = (initialSession: Session | null = null): void => {
    this.currentSession = initialSession ? structuredClone(initialSession) : null;
    this.users.clear();
    this.listeners.clear();
    this.tokenCounter = 0;
    this.userCounter = 0;
    void this.storage.clearSession();
    if (initialSession) {
      this.users.set(this.userKey(initialSession.user), structuredClone(initialSession.user));
      void this.storage.saveSession(initialSession);
    }
  };

  private createUser(values: Omit<User, 'id' | 'createdAt'>): User {
    this.userCounter += 1;
    return {
      ...structuredClone(values),
      id: `user_${this.userCounter}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
  }

  private userKey(user: User): string {
    return user.email?.toLowerCase() ?? user.id;
  }

  private replaceUser(previous: User, next: User): void {
    this.users.delete(this.userKey(previous));
    this.users.set(this.userKey(next), structuredClone(next));
  }

  private validateEmail(email: string): string {
    const trimmed = email?.trim();
    if (!trimmed) {
      throw new AuthError('Email is required', 'invalid_email');
    }
    return trimmed;
  }

  private async requireSession(): Promise<Session> {
    const session = this.currentSession ?? await this.storage.getSession();
    if (!session) {
      throw new AuthError('Authentication required', 'not_authenticated');
    }
    if (session.expiresAt !== undefined && session.expiresAt <= Date.now()) {
      throw new AuthError('Session expired', 'session_expired');
    }
    return session;
  }

  private async createSession(user: User): Promise<Session> {
    this.tokenCounter += 1;
    return this.persistSession({
      token: `mock_token_${Date.now()}_${this.tokenCounter}`,
      user: structuredClone(user),
      expiresAt: Date.now() + 3600 * 1000,
    });
  }

  private async persistSession(session: Session): Promise<Session> {
    const stored = structuredClone(session);
    await this.storage.saveSession(stored);
    this.currentSession = stored;
    this.notifyListeners();
    return structuredClone(stored);
  }

  private async clearSessionState(): Promise<void> {
    await this.storage.clearSession();
    this.currentSession = null;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const session = this.currentSession;
    for (const listener of this.listeners) {
      try {
        listener(session ? structuredClone(session) : null);
      }
      catch (error) {
        console.warn('MockAuthProvider listener threw an error:', error);
      }
    }
  }
}
