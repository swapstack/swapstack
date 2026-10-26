import * as React from 'react';
import { Text } from 'react-native';
import { MockAuthProvider } from '@/core';
import { act, render, screen, waitFor } from '@/lib/test-utils';
import { AuthSessionProvider, useAuthSession } from '../session';

function SessionView() {
  const { session, isLoading, error } = useAuthSession();
  return <Text>{error ?? (isLoading ? 'loading' : session?.user.id ?? 'signed-out')}</Text>;
}

describe('auth session provider', () => {
  it('restores a persisted session', async () => {
    const provider = new MockAuthProvider();
    const created = await provider.signInAnonymously();
    render(<AuthSessionProvider provider={provider}><SessionView /></AuthSessionProvider>);

    expect(await screen.findByText(created.user.id)).toBeOnTheScreen();
  });

  it('updates when authentication changes', async () => {
    const provider = new MockAuthProvider();
    render(<AuthSessionProvider provider={provider}><SessionView /></AuthSessionProvider>);
    expect(await screen.findByText('signed-out')).toBeOnTheScreen();

    await act(async () => {
      await provider.signInAnonymously();
    });
    await waitFor(() => expect(screen.queryByText('signed-out')).not.toBeOnTheScreen());
  });

  it('surfaces session restoration failures', async () => {
    const provider = new MockAuthProvider();
    jest.spyOn(provider, 'getSession').mockRejectedValue(new Error('Storage unavailable'));
    render(<AuthSessionProvider provider={provider}><SessionView /></AuthSessionProvider>);

    expect(await screen.findByText('Storage unavailable')).toBeOnTheScreen();
  });
});
