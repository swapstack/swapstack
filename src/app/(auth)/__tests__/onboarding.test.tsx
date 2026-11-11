import * as React from 'react';
import OnboardingScreen from '@/app/(auth)/onboarding';
import { mockAnalyticsProvider, MockAuthProvider } from '@/core';
import { AuthSessionProvider } from '@/features/auth/session';
import {
  hasSeenOnboarding,
  resetOnboardingSeen,
} from '@/features/onboarding/onboarding-storage';
import { screen, setup, waitFor } from '@/lib/test-utils';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

describe('onboarding screen', () => {
  beforeEach(async () => {
    resetOnboardingSeen();
    await mockAnalyticsProvider.reset();
    mockAnalyticsProvider.setEnabled(true);
  });

  it('steps through onboarding slides and signs in as a guest', async () => {
    const auth = new MockAuthProvider();
    const { user } = setup(
      <AuthSessionProvider provider={auth}>
        <OnboardingScreen />
      </AuthSessionProvider>,
    );

    expect(await screen.findByText('Vendor-agnostic foundation')).toBeOnTheScreen();
    expect(hasSeenOnboarding()).toBe(false);

    await user.press(screen.getByTestId('onboarding-next-button'));
    expect(await screen.findByText('Zero API keys required locally')).toBeOnTheScreen();

    await user.press(screen.getByTestId('onboarding-next-button'));
    expect(await screen.findByText('Swap providers via .env')).toBeOnTheScreen();

    await user.press(screen.getByTestId('onboarding-back-button'));
    expect(await screen.findByText('Zero API keys required locally')).toBeOnTheScreen();

    await user.press(screen.getByTestId('onboarding-guest-button'));

    await waitFor(async () => {
      expect(hasSeenOnboarding()).toBe(true);
      expect((await auth.getSession())?.user.isAnonymous).toBe(true);
    });
  });
});
