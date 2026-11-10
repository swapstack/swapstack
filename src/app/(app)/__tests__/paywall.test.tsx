import * as React from 'react';
import PaywallScreen from '@/app/(app)/paywall';
import { DEFAULT_MOCK_OFFERINGS, MockAuthProvider, mockBillingProvider } from '@/core';
import { AuthSessionProvider } from '@/features/auth/session';
import { screen, setup, waitFor } from '@/lib/test-utils';

jest.setTimeout(10_000);

describe('paywall screen', () => {
  beforeEach(() => {
    mockBillingProvider.reset();
  });

  it('renders mock offerings and activates a purchase', async () => {
    const auth = new MockAuthProvider();
    await auth.signInAnonymously();
    const { user } = setup(
      <AuthSessionProvider provider={auth}><PaywallScreen /></AuthSessionProvider>,
    );

    expect(await screen.findByText('Pro Monthly')).toBeOnTheScreen();
    expect(screen.getByText('$4.99/mo')).toBeOnTheScreen();

    await user.press(screen.getByTestId('purchase-pro_monthly'));
    expect(await screen.findByText('Subscription active')).toBeOnTheScreen();
    await waitFor(async () => {
      expect((await mockBillingProvider.getEntitlements()).find(e => e.id === 'pro')?.isActive).toBe(true);
    });
  });

  it('restores purchases from the paywall', async () => {
    const auth = new MockAuthProvider();
    await auth.signInAnonymously();
    mockBillingProvider.reset(DEFAULT_MOCK_OFFERINGS, [{
      id: 'pro',
      isActive: true,
      expirationDate: null,
    }]);
    const { user } = setup(
      <AuthSessionProvider provider={auth}><PaywallScreen /></AuthSessionProvider>,
    );

    await user.press(await screen.findByTestId('restore-purchases-button'));
    expect(await screen.findByText('Subscription active')).toBeOnTheScreen();
  });
});
