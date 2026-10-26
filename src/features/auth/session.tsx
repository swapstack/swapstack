/* eslint-disable react-refresh/only-export-components */
import type { AuthProvider } from '@/core';
import type { Session } from '@/core/types';
import * as React from 'react';
import { getAuthProvider } from '@/lib/providers';

type AuthSessionValue = {
  readonly auth: AuthProvider;
  readonly session: Session | null;
  readonly isLoading: boolean;
  readonly error: string | null;
};

const AuthSessionContext = React.createContext<AuthSessionValue | null>(null);

export function AuthSessionProvider({
  children,
  provider = getAuthProvider(),
}: {
  readonly children: React.ReactNode;
  readonly provider?: AuthProvider;
}) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    let changedBeforeRestore = false;
    const unsubscribe = provider.onAuthChange((next) => {
      if (active) {
        changedBeforeRestore = true;
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
          setError(cause instanceof Error ? cause.message : 'Unable to restore your session.');
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
  }, [provider]);

  const value = React.useMemo(() => ({ auth: provider, session, isLoading, error }), [provider, session, isLoading, error]);
  return <AuthSessionContext value={value}>{children}</AuthSessionContext>;
}

export function useAuthSession(): AuthSessionValue {
  const value = React.use(AuthSessionContext);
  if (!value) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider.');
  }
  return value;
}
