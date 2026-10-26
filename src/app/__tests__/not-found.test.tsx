import * as React from 'react';
import { render, screen } from '@/lib/test-utils';

import NotFoundScreen from '../+not-found';

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

describe('not-found screen', () => {
  it('offers a neutral route back home', () => {
    render(<NotFoundScreen />);

    expect(screen.getByText('Page not found')).toBeOnTheScreen();
    expect(screen.getByText('Return home')).toBeOnTheScreen();
    expect(screen.queryByText(/Oops|doesn't exist/)).not.toBeOnTheScreen();
  });
});
