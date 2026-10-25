import type { Session, SessionStorage } from '@/core';
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';

export class SecureSessionStorage implements SessionStorage {
  constructor(private readonly key = 'swapstack.auth.session') {}

  readonly getSession = async (): Promise<Session | null> => {
    const value = await getItemAsync(this.key);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as Session;
    }
    catch {
      await this.clearSession();
      return null;
    }
  };

  readonly saveSession = async (session: Session): Promise<void> => {
    await setItemAsync(this.key, JSON.stringify(session));
  };

  readonly clearSession = async (): Promise<void> => {
    await deleteItemAsync(this.key);
  };
}
