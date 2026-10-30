import type { SupportedStorage } from '@supabase/supabase-js';
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';

export class SupabaseTokenStorage implements SupportedStorage {
  constructor(private readonly prefix = 'swapstack.supabase') {}

  getItem(key: string): Promise<string | null> {
    return getItemAsync(this.key(key));
  }

  setItem(key: string, value: string): Promise<void> {
    return setItemAsync(this.key(key), value);
  }

  removeItem(key: string): Promise<void> {
    return deleteItemAsync(this.key(key));
  }

  private key(key: string): string {
    return `${this.prefix}.${key}`;
  }
}
