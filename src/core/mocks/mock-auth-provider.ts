import type {
  AuthProvider,
  AuthStateChangeCallback,
  SignInCredentials,
  SignUpCredentials,
} from '../auth';
import type { Session, Unsubscribe, User } from '../types';

export class MockAuthProvider implements AuthProvider {
  private currentSession: Session | null;
  private readonly users = new Map<string, User>();
  private readonly listeners = new Set<AuthStateChangeCallback>();
  private tokenCounter = 0;

  constructor(initialSession: Session | null = null, initialUsers: readonly User[] = []) {
    this.currentSession = initialSession;
    for (const user of initialUsers) {
      this.users.set(user.email.toLowerCase(), user);
    }
    if (initialSession?.user) {
      this.users.set(initialSession.user.email.toLowerCase(), initialSession.user);
    }
  }

  // Note: Passwords are not verified in MockAuthProvider to simplify testing
  readonly signIn = async (credentials: SignInCredentials): Promise<Session> => {
    const email = this.validateEmail(credentials.email);
    const user = this.users.get(email.toLowerCase());

    if (!user) {
      throw new Error(`User not found: ${email}`);
    }

    return this.createSession(user);
  };

  // Note: Passwords are not verified in MockAuthProvider to simplify testing
  readonly signUp = async (credentials: SignUpCredentials): Promise<Session> => {
    const email = this.validateEmail(credentials.email);
    const key = email.toLowerCase();

    if (this.users.has(key)) {
      throw new Error(`User already exists: ${email}`);
    }

    const user: User = {
      id: `user_${key.replace(/[^a-z0-9]/gi, '_')}`,
      email,
      createdAt: new Date().toISOString(),
      metadata: credentials.metadata,
    };

    this.users.set(key, user);
    return this.createSession(user);
  };

  readonly signOut = async (): Promise<void> => {
    this.currentSession = null;
    this.notifyListeners();
  };

  readonly getSession = async (): Promise<Session | null> => {
    return this.currentSession;
  };

  readonly onAuthChange = (callback: AuthStateChangeCallback): Unsubscribe => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  /**
   * Test-only helper to reset authentication state, registered users, and listeners.
   */
  readonly reset = (initialSession: Session | null = null): void => {
    this.currentSession = initialSession;
    this.users.clear();
    this.listeners.clear();
    this.tokenCounter = 0;
    if (initialSession?.user) {
      this.users.set(initialSession.user.email.toLowerCase(), initialSession.user);
    }
  };

  private validateEmail(email: string): string {
    const trimmed = email?.trim();
    if (!trimmed) {
      throw new Error('Email is required');
    }
    return trimmed;
  }

  private createSession(user: User): Session {
    this.tokenCounter += 1;
    const session: Session = {
      token: `mock_token_${Date.now()}_${this.tokenCounter}`,
      user,
      expiresAt: Date.now() + 3600 * 1000,
    };

    this.currentSession = session;
    this.notifyListeners();
    return session;
  }

  private notifyListeners(): void {
    const session = this.currentSession;
    for (const listener of this.listeners) {
      try {
        listener(session);
      }
      catch {
        // Silently catch listener exceptions so one failing listener does not break others
      }
    }
  }
}
