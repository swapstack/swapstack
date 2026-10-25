import * as React from 'react';

import { serviceProviders } from '@/lib/services';
import { cleanup, render, screen } from '@/lib/test-utils';

import HomeScreen from '../index';

afterEach(cleanup);

describe('home screen', () => {
  it('renders mock providers message when mode is mock', () => {
    render(<HomeScreen />);
    expect(screen.getByText(/mock providers, no keys required/)).toBeOnTheScreen();
  });

  it('renders active mode text when a provider is in live mode', () => {
    const originalMode = serviceProviders.backend.mode;
    Object.defineProperty(serviceProviders.backend, 'mode', {
      value: 'live',
      configurable: true,
    });

    render(<HomeScreen />);
    expect(screen.getByText(/active in live \/ mock mode/)).toBeOnTheScreen();

    Object.defineProperty(serviceProviders.backend, 'mode', {
      value: originalMode,
      configurable: true,
    });
  });
});
