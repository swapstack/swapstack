import type {
  AuthProvider,
  AuthStateChangeCallback,
  OAuthProvider,
  SignInCredentials,
  SignUpCredentials,
} from '../auth';
import type { Session, Unsubscribe, User } from '../types';
import { AuthError } from '../errors';

export class MockAuthProvider implements AuthProvider {
  readonly mode = 'mock' as const;
  private currentSession: Session | null;
  private readonly users = new Map<string, User>();
  private readonly listeners = new Set<AuthStateChangeCallback>();
  private tokenCounter = 0;
  private userCounter = 0;

  constructor(initialSession: Session | null = null, initialUsers: readonly User[] = []) {
    this.currentSession = initialSession ? structuredClone(initialSession) : null;
    for (const user of initialUsers) {
      this.users.set(user.email.toLowerCase(), structuredClone(user));
    }
    if (initialSession?.user) {
      this.users.set(initialSession.user.email.toLowerCase(), structuredClone(initialSession.user));
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

  readonly signUp = async (credentials: SignUpCredentials): Promise<Session> => {
    const email = this.validateEmail(credentials.email);
    const key = email.toLowerCase();

    if (this.users.has(key)) {
      throw new AuthError(`User already exists: ${email}`, 'user_already_exists');
    }

    this.userCounter += 1;
    const user: User = {
      id: `user_${this.userCounter}_${Math.random().toString(36).slice(2, 9)}`,
      email,
      createdAt: new Date().toISOString(),
      metadata: structuredClone(credentials.metadata),
    };

    this.users.set(key, structuredClone(user));
    return this.createSession(user);
  };

  readonly signInWithOAuth = async (provider: OAuthProvider): Promise<Session> => {
    const email = `mock_${provider}_user@swapstack.org`;
    const key = email.toLowerCase();
    let user = this.users.get(key);

    if (!user) {
      this.userCounter += 1;
      user = {
        id: `user_${provider}_${this.userCounter}_${Math.random().toString(36).slice(2, 9)}`,
        email,
        createdAt: new Date().toISOString(),
        metadata: { provider },
      };
      this.users.set(key, structuredClone(user));
    }

    return this.createSession(user);
  };

  readonly signOut = async (): Promise<void> => {
    this.currentSession = null;
    this.notifyListeners();
  };

  readonly getSession = async (): Promise<Session | null> => {
    if (
      this.currentSession
      && this.currentSession.expiresAt !== undefined
      && this.currentSession.expiresAt <= Date.now()
    ) {
      this.currentSession = null;
      this.notifyListeners();
      return null;
    }
    return this.currentSession ? structuredClone(this.currentSession) : null;
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
    if (initialSession?.user) {
      this.users.set(initialSession.user.email.toLowerCase(), structuredClone(initialSession.user));
    }
  };

  private validateEmail(email: string): string {
    const trimmed = email?.trim();
    if (!trimmed) {
      throw new AuthError('Email is required', 'invalid_email');
    }
    return trimmed;
  }

  private createSession(user: User): Session {
    this.tokenCounter += 1;
    const session: Session = {
      token: `mock_token_${Date.now()}_${this.tokenCounter}`,
      user: structuredClone(user),
      expiresAt: Date.now() + 3600 * 1000,
    };

    this.currentSession = session;
    this.notifyListeners();
    return structuredClone(session);
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
