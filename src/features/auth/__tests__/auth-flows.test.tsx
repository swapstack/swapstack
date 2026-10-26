/* eslint-disable react/no-unnecessary-use-prefix */
import type { ReactElement } from 'react';
import * as React from 'react';
import EmailVerificationPendingScreen from '@/app/(auth)/email-verification-pending';
import ForgotPasswordScreen from '@/app/(auth)/forgot-password';
import LinkAccountScreen from '@/app/(auth)/link-account';
import LoginScreen from '@/app/(auth)/login';
import SignUpScreen from '@/app/(auth)/sign-up';
import { MockAuthProvider } from '@/core';
import { screen, setup, waitFor } from '@/lib/test-utils';
import { AuthSessionProvider } from '../session';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ email: 'pending@example.com' }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

function withProvider(ui: ReactElement, provider: MockAuthProvider) {
  return <AuthSessionProvider provider={provider}>{ui}</AuthSessionProvider>;
}

describe('auth screens', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('validates credentials before submitting', async () => {
    const provider = new MockAuthProvider();
    const { user } = setup(withProvider(<LoginScreen />, provider));
    await user.press(screen.getByTestId('submit-button'));

    expect(await screen.findByText('Email is required.')).toBeOnTheScreen();
    expect(screen.getByText('Password is required.')).toBeOnTheScreen();
  });

  it('signs in with email and password', async () => {
    const provider = new MockAuthProvider();
    await provider.signUp({ email: 'user@example.com', password: 'secretpassword' });
    const { user } = setup(withProvider(<LoginScreen />, provider));

    await user.type(screen.getByTestId('email-input'), 'user@example.com');
    await user.type(screen.getByTestId('password-input'), 'secretpassword');
    await user.press(screen.getByTestId('submit-button'));

    await waitFor(async () => expect((await provider.getSession())?.user.email).toBe('user@example.com'));
  });

  it('continues as a guest', async () => {
    const provider = new MockAuthProvider();
    const { user } = setup(withProvider(<LoginScreen />, provider));
    await user.press(screen.getByTestId('guest-button'));

    await waitFor(async () => expect((await provider.getSession())?.user.isAnonymous).toBe(true));
  });

  it('routes confirmation-pending sign-up to verification', async () => {
    const provider = new MockAuthProvider(null, [], { requireEmailConfirmation: true });
    const { user } = setup(withProvider(<SignUpScreen />, provider));

    await user.type(screen.getByTestId('email-input'), 'new@example.com');
    await user.type(screen.getByTestId('password-input'), 'secretpassword');
    await user.press(screen.getByTestId('submit-button'));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith({
      pathname: '/email-verification-pending',
      params: { email: 'new@example.com' },
    }));
  });

  it('requests password reset instructions', async () => {
    const provider = new MockAuthProvider();
    const resetSpy = jest.spyOn(provider, 'requestPasswordReset');
    const { user } = setup(withProvider(<ForgotPasswordScreen />, provider));

    await user.type(screen.getByTestId('reset-email-input'), 'user@example.com');
    await user.press(screen.getByTestId('reset-button'));

    expect(await screen.findByText(/reset instructions are on their way/)).toBeOnTheScreen();
    expect(resetSpy).toHaveBeenCalledWith('user@example.com');
  });

  it('resends verification email', async () => {
    const provider = new MockAuthProvider();
    const resendSpy = jest.spyOn(provider, 'resendVerification');
    const { user } = setup(withProvider(<EmailVerificationPendingScreen />, provider));

    await user.press(screen.getByTestId('resend-button'));
    await waitFor(() => expect(resendSpy).toHaveBeenCalledWith('pending@example.com'));
  });

  it('upgrades a guest account', async () => {
    const provider = new MockAuthProvider();
    await provider.signInAnonymously();
    const { user } = setup(withProvider(<LinkAccountScreen />, provider));

    await user.type(screen.getByTestId('email-input'), 'linked@example.com');
    await user.type(screen.getByTestId('password-input'), 'secretpassword');
    await user.press(screen.getByTestId('submit-button'));

    await waitFor(async () => expect((await provider.getSession())?.user.email).toBe('linked@example.com'));
  });
});
