import * as React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import { Avatar } from './avatar';

afterEach(cleanup);

describe('avatar component', () => {
  it('renders avatar with initials when no image source is provided', () => {
    render(<Avatar testID="avatar-initials" initials="AA" />);

    expect(screen.getByTestId('avatar-initials')).toBeOnTheScreen();
    expect(screen.getByTestId('avatar-initials-initials')).toHaveTextContent('AA');
  });

  it('renders image when src is provided', () => {
    render(
      <Avatar
        testID="avatar-img"
        src="https://example.com/avatar.png"
        initials="JD"
      />,
    );

    expect(screen.getByTestId('avatar-img')).toBeOnTheScreen();
    expect(screen.getByTestId('avatar-img-image')).toBeOnTheScreen();
  });
});
