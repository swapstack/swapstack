import * as React from 'react';
import { Button, Text } from '@/components/ui';
import { MockAuthProvider } from '@/core';
import * as providers from '@/lib/providers';
import { act, render, screen, setup, waitFor } from '@/lib/test-utils';
import { AuthSessionProvider, useAuthSession } from '../session';

jest.mock('@/lib/providers', () => {
  const actual = jest.requireActual('@/lib/providers');
  return {
    ...actual,
    getAuthProvider: jest.fn(actual.getAuthProvider),
  };
});

function SessionView() {
  const { session, isLoading, error, retry } = useAuthSession();
  return (
    <>
      <Text>{error ?? (isLoading ? 'loading' : session?.user.id ?? 'signed-out')}</Text>
      <Button testID="retry-button" label="Try again" onPress={retry} />
    </>
  );
}

describe('auth session provider', () => {
  afterEach(() => {
    const getAuthProvider = providers.getAuthProvider as jest.Mock;
    getAuthProvider.mockImplementation(
      jest.requireActual<typeof providers>('@/lib/providers').getAuthProvider,
    );
    jest.restoreAllMocks();
    jest.useRealTimers();
  });
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

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();
  });

  it('retries session restoration', async () => {
    const provider = new MockAuthProvider();
    const getSession = jest.spyOn(provider, 'getSession')
      .mockRejectedValueOnce(new Error('Storage unavailable'))
      .mockResolvedValue(null);
    const { user } = setup(<AuthSessionProvider provider={provider}><SessionView /></AuthSessionProvider>);
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();

    await user.press(screen.getByTestId('retry-button'));
    expect(await screen.findByText('signed-out')).toBeOnTheScreen();
    expect(getSession).toHaveBeenCalledTimes(2);
  });

  it('clears stale errors when auth changes', async () => {
    const provider = new MockAuthProvider();
    jest.spyOn(provider, 'getSession').mockRejectedValueOnce(new Error('Storage unavailable'));
    render(<AuthSessionProvider provider={provider}><SessionView /></AuthSessionProvider>);
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();

    await act(async () => {
      await provider.signInAnonymously();
    });
    await waitFor(() => expect(screen.queryByText('Something went wrong. Please try again.')).not.toBeOnTheScreen());
  });

  it('times out a hanging restore and becomes ready', () => {
    jest.useFakeTimers();
    const provider = new MockAuthProvider();
    jest.spyOn(provider, 'getSession').mockImplementation(() => new Promise(() => {}));
    const onReady = jest.fn();
    render(<AuthSessionProvider provider={provider} onReady={onReady}><SessionView /></AuthSessionProvider>);

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByText('Session restoration timed out. Please try again.')).toBeOnTheScreen();
    expect(onReady).toHaveBeenCalled();
  });

  it('handles provider resolution failures without crashing', async () => {
    (providers.getAuthProvider as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid provider');
    });
    render(<AuthSessionProvider><SessionView /></AuthSessionProvider>);

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();
  });
});
