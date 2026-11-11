import * as React from 'react';
import DevToolsScreen from '@/app/(app)/devtools';
import {
  mockBillingProvider,
  mockFeatureFlagProvider,
  mockNetworkProvider,
} from '@/core';
import { screen, setup, waitFor } from '@/lib/test-utils';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

describe('devtools debug studio screen', () => {
  beforeEach(() => {
    mockNetworkProvider.reset();
    mockBillingProvider.reset();
    mockFeatureFlagProvider.reset();
  });

  it('simulates offline mode, unlocks pro entitlement, and overrides feature flags', async () => {
    const { user } = setup(<DevToolsScreen />);

    expect(await screen.findByText('Developer Debug Studio')).toBeOnTheScreen();
    expect(await screen.findByText('Network status: Online (wifi)')).toBeOnTheScreen();
    expect(screen.getByText('Entitlements: none (Free tier)')).toBeOnTheScreen();

    await user.press(screen.getByTestId('devtools-toggle-network-button'));
    expect(await screen.findByText('Network status: Offline (queued sync active)')).toBeOnTheScreen();
    expect(await mockNetworkProvider.isOnline()).toBe(false);

    await user.press(screen.getByTestId('devtools-toggle-pro-button'));
    await waitFor(() => {
      expect(screen.getByText('Entitlements: pro (Active)')).toBeOnTheScreen();
    });

    await user.press(screen.getByTestId('devtools-flag-onboarding_v2'));
    expect(await mockFeatureFlagProvider.isEnabled('onboarding_v2')).toBe(true);
  });
});
