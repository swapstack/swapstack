import type { Session, Unsubscribe, User } from './types';

export type SignInCredentials = {
  readonly email: string;
  readonly password: string;
};

export type SignUpCredentials = {
  readonly email: string;
  readonly password: string;
  readonly metadata?: Record<string, unknown>;
};

export type LinkAccountCredentials = SignUpCredentials;
export type ProfileUpdate = Partial<Pick<User, 'displayName' | 'avatarUrl' | 'metadata'>>;
export type OAuthProvider = 'apple' | 'google';
export type AuthStateChangeCallback = (session: Session | null) => void;

export type AuthProvider = {
  readonly mode?: 'mock' | 'live';
  readonly signIn: (credentials: SignInCredentials) => Promise<Session>;
  readonly signUp: (credentials: SignUpCredentials) => Promise<Session | null>;
  readonly signInWithOAuth: (provider: OAuthProvider) => Promise<Session>;
  readonly signInAnonymously: () => Promise<Session>;
  readonly linkAccount: (credentials: LinkAccountCredentials) => Promise<Session | null>;
  readonly requestPasswordReset: (email: string) => Promise<void>;
  readonly resendVerification: (email: string) => Promise<void>;
  readonly updateProfile: (updates: ProfileUpdate) => Promise<User>;
  readonly deleteAccount: () => Promise<void>;
  readonly refreshSession: () => Promise<Session | null>;
  readonly signOut: () => Promise<void>;
  readonly getSession: () => Promise<Session | null>;
  readonly onAuthChange: (callback: AuthStateChangeCallback) => Unsubscribe;
};
