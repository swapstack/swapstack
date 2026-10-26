import * as React from 'react';
import ProfileScreen from '@/app/(app)/profile';
import { MockAuthProvider } from '@/core';
import { act, screen, setup, waitFor } from '@/lib/test-utils';
import { AuthSessionProvider } from '../session';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

describe('profile flows', () => {
  it('shows guest upgrade and saves a display name', async () => {
    const provider = new MockAuthProvider();
    await provider.signInAnonymously();
    const { user } = setup(
      <AuthSessionProvider provider={provider}><ProfileScreen /></AuthSessionProvider>,
    );

    expect(await screen.findByText('Upgrade your account')).toBeOnTheScreen();
    await user.type(await screen.findByTestId('name-input'), 'Swapstack User');
    await user.press(await screen.findByTestId('save-profile-button'));

    await waitFor(async () => expect((await provider.getSession())?.user.displayName).toBe('Swapstack User'));
  });

  it('warns guests before signing out and losing data', async () => {
    const provider = new MockAuthProvider();
    await provider.signInAnonymously();
    const { user } = setup(
      <AuthSessionProvider provider={provider}><ProfileScreen /></AuthSessionProvider>,
    );

    await user.press(await screen.findByTestId('sign-out-button'));
    expect(await screen.findByText(/permanently lose this guest account/)).toBeOnTheScreen();
    expect(screen.getByText('Create account')).toBeOnTheScreen();
    await user.press(screen.getByTestId('confirm-guest-sign-out-button'));
    await waitFor(async () => expect(await provider.getSession()).toBeNull());
  });

  it('synchronizes the name after later session updates', async () => {
    const provider = new MockAuthProvider();
    await provider.signInAnonymously();
    setup(<AuthSessionProvider provider={provider}><ProfileScreen /></AuthSessionProvider>);
    const input = await screen.findByTestId('name-input');

    await act(async () => {
      await provider.updateProfile({ displayName: 'Updated elsewhere' });
    });
    expect(input.props.value).toBe('Updated elsewhere');
  });

  it('requires confirmation before account deletion', async () => {
    const provider = new MockAuthProvider();
    await provider.signInAnonymously();
    const { user } = setup(
      <AuthSessionProvider provider={provider}><ProfileScreen /></AuthSessionProvider>,
    );

    await user.press(await screen.findByTestId('delete-button'));
    await user.press(await screen.findByTestId('confirm-delete-button'));
    await waitFor(async () => expect(await provider.getSession()).toBeNull());
  });
});
