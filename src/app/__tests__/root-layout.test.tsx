/* eslint-disable react/no-unnecessary-use-prefix */
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { mockAuthProvider } from '@/core';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { act, render, screen, waitFor } from '@/lib/test-utils';

import RootLayout from '../_layout';

const hideSplash = SplashScreen.hideAsync as jest.Mock;

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

const mockUseFonts = jest.fn(() => [true, null] as [boolean, Error | null]);

jest.mock('expo-font', () => ({
  useFonts: () => mockUseFonts(),
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
  afterEach(() => {
    mockUseFonts.mockReturnValue([true, null]);
    hideSplash.mockClear();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('renders providers and hides the splash screen when ready', async () => {
    render(<RootLayout />);

    expect(await screen.findByText('root-stack')).toBeOnTheScreen();
    expect(loadSelectedTheme).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(hideSplash).toHaveBeenCalled());
  });

  it('hides the splash screen when font loading fails', async () => {
    mockUseFonts.mockReturnValue([false, new Error('Font failed')]);
    render(<RootLayout />);

    await waitFor(() => expect(hideSplash).toHaveBeenCalled());
  });

  it('hides the splash screen when session restoration hangs', () => {
    jest.useFakeTimers();
    jest.spyOn(mockAuthProvider, 'getSession').mockImplementation(() => new Promise(() => {}));
    render(<RootLayout />);

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(hideSplash).toHaveBeenCalled();
  });
});
