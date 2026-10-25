import type { Session } from './types';

export type SessionStorage = {
  readonly getSession: () => Promise<Session | null>;
  readonly saveSession: (session: Session) => Promise<void>;
  readonly clearSession: () => Promise<void>;
};
