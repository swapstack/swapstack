/* eslint-disable react-refresh/only-export-components */
import type { AuthProvider } from '@/core';
import type { Session } from '@/core/types';
import * as React from 'react';
import { mockAuthProvider } from '@/core';
import { getAuthProvider } from '@/lib/providers';
import { getErrorMessage } from './validation';

const RESTORE_TIMEOUT_MS = 5000;

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
  provider: providedProvider,
  onReady,
}: {
  readonly children: React.ReactNode;
  readonly provider?: AuthProvider;
  readonly onReady?: () => void;
}) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [restoreLoading, setRestoreLoading] = React.useState(true);
  const [restoreError, setRestoreError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);
  const resolution = React.useMemo(() => {
    try {
      return { provider: providedProvider ?? getAuthProvider(), error: null, revision: attempt };
    }
    catch (error) {
      return { provider: mockAuthProvider, error, revision: attempt };
    }
  }, [providedProvider, attempt]);
  const provider = resolution.provider;
  const isLoading = resolution.error ? false : restoreLoading;
  const error = resolution.error ? getErrorMessage(resolution.error) : restoreError;

  React.useEffect(() => {
    if (resolution.error) {
      return;
    }

    let active = true;
    let changedBeforeRestore = false;
    const timeout = setTimeout(() => {
      if (active) {
        changedBeforeRestore = true;
        setRestoreError('Session restoration timed out. Please try again.');
        setSession(null);
        setRestoreLoading(false);
      }
    }, RESTORE_TIMEOUT_MS);
    const unsubscribe = provider.onAuthChange((next) => {
      if (active) {
        changedBeforeRestore = true;
        setRestoreError(null);
        setSession(next);
        setRestoreLoading(false);
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
          setRestoreError(getErrorMessage(cause));
        }
      })
      .finally(() => {
        if (active) {
          setRestoreLoading(false);
        }
      });

    return () => {
      active = false;
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [provider, attempt, resolution.error]);

  React.useEffect(() => {
    if (!isLoading) {
      onReady?.();
    }
  }, [isLoading, onReady]);

  const retry = React.useCallback(() => {
    setRestoreError(null);
    setRestoreLoading(true);
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
