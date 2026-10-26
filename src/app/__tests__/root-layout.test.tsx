/* eslint-disable react/no-unnecessary-use-prefix */
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { render, screen, waitFor } from '@/lib/test-utils';

import RootLayout from '../_layout';

jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Stack: () => React.createElement(Text, null, 'root-stack'),
  };
});

jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-keyboard-controller', () => ({
  KeyboardProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/lib/api', () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@expo-google-fonts/inter', () => ({
  Inter_400Regular: null,
  Inter_500Medium: null,
  Inter_600SemiBold: null,
  Inter_700Bold: null,
  useFonts: () => [true, null],
}));

jest.mock('@/lib/hooks/use-selected-theme', () => ({
  loadSelectedTheme: jest.fn(),
}));

jest.mock('react-native-flash-message', () => ({
  __esModule: true,
  default: () => null,
  showMessage: jest.fn(),
}));

describe('root layout', () => {
  it('renders providers and hides the splash screen when ready', async () => {
    render(<RootLayout />);

    expect(await screen.findByText('root-stack')).toBeOnTheScreen();
    expect(loadSelectedTheme).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(SplashScreen.hideAsync).toHaveBeenCalled());
  });
});
