/* eslint-disable react-refresh/only-export-components */
import type { AuthProvider } from '@/core';
import type { Session } from '@/core/types';
import * as React from 'react';
import { getAuthProvider } from '@/lib/providers';
import { getErrorMessage } from './validation';

type AuthSessionValue = {
  readonly auth: AuthProvider;
  readonly session: Session | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly retry: () => void;
};

const AuthSessionContext = React.createContext<AuthSessionValue | null>(null);

export function AuthSessionProvider({
  children,
  provider = getAuthProvider(),
  onReady,
}: {
  readonly children: React.ReactNode;
  readonly provider?: AuthProvider;
  readonly onReady?: () => void;
}) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    let changedBeforeRestore = false;
    const unsubscribe = provider.onAuthChange((next) => {
      if (active) {
        changedBeforeRestore = true;
        setError(null);
        setSession(next);
        setIsLoading(false);
      }
    });

    provider.getSession()
      .then((stored) => {
        if (active && !changedBeforeRestore) {
          setSession(stored);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(getErrorMessage(cause));
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [provider, attempt]);

  React.useEffect(() => {
    if (!isLoading) {
      onReady?.();
    }
  }, [isLoading, onReady]);

  const retry = React.useCallback(() => {
    setError(null);
    setIsLoading(true);
    setAttempt(value => value + 1);
  }, []);
  const value = React.useMemo(
    () => ({ auth: provider, session, isLoading, error, retry }),
    [provider, session, isLoading, error, retry],
  );
  return <AuthSessionContext value={value}>{children}</AuthSessionContext>;
}

export function useAuthSession(): AuthSessionValue {
  const value = React.use(AuthSessionContext);
  if (!value) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider.');
  }
  return value;
}
