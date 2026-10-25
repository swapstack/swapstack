import type { Session } from './types';
import { AuthError } from './errors';

export async function withAuthRetry<T>(
  operation: () => Promise<T>,
  refresh: () => Promise<Session | null>,
): Promise<T> {
  try {
    return await operation();
  }
  catch (error) {
    if (!(error instanceof AuthError) || error.code !== 'session_expired') {
      throw error;
    }

    const session = await refresh();
    if (!session) {
      throw error;
    }
    return operation();
  }
}
