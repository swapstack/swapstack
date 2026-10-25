import type { SessionStorage } from '../session-storage';
import type { Session } from '../types';

export class InMemorySessionStorage implements SessionStorage {
  private session: Session | null = null;

  constructor(initialSession: Session | null = null) {
    this.session = initialSession ? structuredClone(initialSession) : null;
  }

  readonly getSession = async (): Promise<Session | null> => {
    return this.session ? structuredClone(this.session) : null;
  };

  readonly saveSession = async (session: Session): Promise<void> => {
    this.session = structuredClone(session);
  };

  readonly clearSession = async (): Promise<void> => {
    this.session = null;
  };
}
