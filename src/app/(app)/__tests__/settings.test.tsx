import * as React from 'react';
import SettingsScreen from '@/app/(app)/settings';
import {
  mockAnalyticsProvider,
  mockBillingProvider,
  mockBiometricProvider,
  mockNotificationProvider,
} from '@/core';
import { screen, setup, waitFor } from '@/lib/test-utils';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

describe('settings screen', () => {
  beforeEach(async () => {
    mockBillingProvider.reset();
    mockNotificationProvider.reset();
    mockBiometricProvider.reset();
    await mockAnalyticsProvider.reset();
    mockAnalyticsProvider.setEnabled(true);
  });

  it('switches themes, enables notifications, and toggles analytics and biometrics', async () => {
    const { user } = setup(<SettingsScreen />);

    expect(await screen.findByText('Settings')).toBeOnTheScreen();
    expect(await screen.findByText('Permission status: undetermined')).toBeOnTheScreen();
    expect(screen.getByText('Current plan: Free')).toBeOnTheScreen();

    await user.press(screen.getByTestId('theme-dark-button'));
    expect(await screen.findByText('Active theme: dark')).toBeOnTheScreen();

    await user.press(screen.getByTestId('enable-notifications-button'));
    await waitFor(() => {
      expect(screen.getByText('Permission status: granted')).toBeOnTheScreen();
    });

    await user.press(await screen.findByTestId('test-notification-button'));
    expect(await screen.findByText('Scheduled: Test notification')).toBeOnTheScreen();

    await user.press(screen.getByTestId('analytics-opt-in-checkbox'));
    expect(mockAnalyticsProvider.isEnabled()).toBe(false);

    await user.press(screen.getByTestId('biometric-lock-checkbox'));
    expect(await mockBiometricProvider.isAppLockEnabled()).toBe(true);
  });
});
