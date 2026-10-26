import * as React from 'react';
import ProfileScreen from '@/app/(app)/profile';
import { MockAuthProvider } from '@/core';
import { screen, setup, waitFor } from '@/lib/test-utils';
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

  it('signs out', async () => {
    const provider = new MockAuthProvider();
    await provider.signInAnonymously();
    const { user } = setup(
      <AuthSessionProvider provider={provider}><ProfileScreen /></AuthSessionProvider>,
    );

    await user.press(await screen.findByTestId('sign-out-button'));
    await waitFor(async () => expect(await provider.getSession()).toBeNull());
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
