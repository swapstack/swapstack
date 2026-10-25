import * as React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import { Divider } from './divider';

afterEach(cleanup);

describe('divider component', () => {
  it('renders horizontal divider correctly', () => {
    render(<Divider testID="horizontal-divider" />);
    expect(screen.getByTestId('horizontal-divider')).toBeOnTheScreen();
  });

  it('renders vertical divider correctly', () => {
    render(<Divider orientation="vertical" testID="vertical-divider" />);
    expect(screen.getByTestId('vertical-divider')).toBeOnTheScreen();
  });

  it('renders divider with center label correctly', () => {
    render(<Divider label="OR" testID="labeled-divider" />);
    expect(screen.getByTestId('labeled-divider')).toBeOnTheScreen();
    expect(screen.getByTestId('labeled-divider-label')).toHaveTextContent('OR');
  });
});
