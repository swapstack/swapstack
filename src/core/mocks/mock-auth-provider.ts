import type {
  AuthProvider,
  AuthStateChangeCallback,
  SignInCredentials,
  SignUpCredentials,
} from '../auth';
import type { Session, Unsubscribe, User } from '../types';

export class MockAuthProvider implements AuthProvider {
  private currentSession: Session | null;
  private readonly listeners = new Set<AuthStateChangeCallback>();

  constructor(initialSession: Session | null = null) {
    this.currentSession = initialSession;
  }

  readonly signIn = async (credentials: SignInCredentials): Promise<Session> => {
    if (!credentials.email || credentials.email.trim() === '') {
      throw new Error('Email is required');
    }

    const user: User = {
      id: `user_${credentials.email.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
      email: credentials.email,
      createdAt: new Date().toISOString(),
    };

    const session: Session = {
      token: `mock_token_${Date.now()}`,
      user,
      expiresAt: Date.now() + 3600 * 1000,
    };

    this.currentSession = session;
    this.notifyListeners();
    return session;
  };

  readonly signUp = async (credentials: SignUpCredentials): Promise<Session> => {
    if (!credentials.email || credentials.email.trim() === '') {
      throw new Error('Email is required');
    }

    const user: User = {
      id: `user_${credentials.email.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
      email: credentials.email,
      createdAt: new Date().toISOString(),
      metadata: credentials.metadata,
    };

    const session: Session = {
      token: `mock_token_${Date.now()}`,
      user,
      expiresAt: Date.now() + 3600 * 1000,
    };

    this.currentSession = session;
    this.notifyListeners();
    return session;
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

  readonly reset = (initialSession: Session | null = null): void => {
    this.currentSession = initialSession;
    this.listeners.clear();
  };

  private notifyListeners(): void {
    const session = this.currentSession;
    for (const listener of this.listeners) {
      listener(session);
    }
  }
}
