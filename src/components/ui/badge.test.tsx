import * as React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import { Badge } from './badge';

afterEach(cleanup);

describe('badge component', () => {
  it.each(['default', 'secondary', 'outline', 'success', 'destructive'] as const)(
    'renders its label for the %s variant',
    (variant) => {
      render(<Badge testID={`badge-${variant}`} label={`${variant} badge`} variant={variant} />);
      expect(screen.getByTestId(`badge-${variant}-label`)).toHaveTextContent(`${variant} badge`);
    },
  );

  it('exposes an accessibility label', () => {
    render(<Badge testID="pro-badge" label="Pro" />);
    expect(screen.getByLabelText('Pro')).toBeOnTheScreen();
  });
});
