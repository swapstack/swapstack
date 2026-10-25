import type { Session, Unsubscribe } from './types';

export type SignInCredentials = {
  readonly email: string;
  readonly password?: string;
};

export type SignUpCredentials = {
  readonly email: string;
  readonly password?: string;
  readonly metadata?: Record<string, unknown>;
};

export type OAuthProvider = 'apple' | 'google';

export type AuthStateChangeCallback = (session: Session | null) => void;

export type AuthProvider = {
  readonly mode?: 'mock' | 'live';
  readonly signIn: (credentials: SignInCredentials) => Promise<Session>;
  readonly signUp: (credentials: SignUpCredentials) => Promise<Session>;
  readonly signInWithOAuth: (provider: OAuthProvider) => Promise<Session>;
  readonly signOut: () => Promise<void>;
  readonly getSession: () => Promise<Session | null>;
  readonly onAuthChange: (callback: AuthStateChangeCallback) => Unsubscribe;
};
