/* eslint-disable react/no-unnecessary-use-prefix */
import * as React from 'react';
import AppLayout from '@/app/(app)/_layout';
import AuthLayout from '@/app/(auth)/_layout';
import { MockAuthProvider } from '@/core';
import { render, screen } from '@/lib/test-utils';
import { AuthSessionProvider } from '../session';

const mockSegments: string[] = ['(auth)', 'login'];

jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => React.createElement(Text, { testID: 'redirect' }, href),
    Stack: () => React.createElement(Text, { testID: 'stack' }, 'stack'),
    useSegments: () => mockSegments,
  };
});

describe('auth route gates', () => {
  beforeEach(() => {
    mockSegments.splice(0, mockSegments.length, '(auth)', 'login');
  });

  it('redirects signed-out app users to login', async () => {
    render(<AuthSessionProvider><AppLayout /></AuthSessionProvider>);
    expect(await screen.findByText('/login')).toBeOnTheScreen();
  });

  it('allows signed-in app users', async () => {
    const provider = new MockAuthProvider();
    await provider.signInAnonymously();
    render(<AuthSessionProvider provider={provider}><AppLayout /></AuthSessionProvider>);
    expect(await screen.findByText('stack')).toBeOnTheScreen();
  });

  it('redirects signed-in auth users home', async () => {
    const provider = new MockAuthProvider();
    await provider.signInAnonymously();
    render(<AuthSessionProvider provider={provider}><AuthLayout /></AuthSessionProvider>);
    expect(await screen.findByText('/')).toBeOnTheScreen();
  });

  it('allows guests to reach account upgrade', async () => {
    const provider = new MockAuthProvider();
    await provider.signInAnonymously();
    mockSegments.splice(0, mockSegments.length, '(auth)', 'link-account');
    render(<AuthSessionProvider provider={provider}><AuthLayout /></AuthSessionProvider>);
    expect(await screen.findByText('stack')).toBeOnTheScreen();
  });

  it('allows verification pending without redirecting to login', async () => {
    mockSegments.splice(0, mockSegments.length, '(auth)', 'email-verification-pending');
    render(<AuthSessionProvider><AuthLayout /></AuthSessionProvider>);

    expect(await screen.findByText('stack')).toBeOnTheScreen();
    expect(screen.queryByTestId('redirect')).not.toBeOnTheScreen();
  });
});
