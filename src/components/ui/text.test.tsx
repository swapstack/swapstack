import * as React from 'react';
import { I18nManager } from 'react-native';

import { cleanup, render, screen } from '@/lib/test-utils';

import { Text } from './text';

afterEach(cleanup);

describe('text component', () => {
  it('renders text content correctly', () => {
    render(<Text testID="app-text">Hello Swapstack</Text>);

    const element = screen.getByTestId('app-text');
    expect(element).toBeOnTheScreen();
    expect(element).toHaveTextContent('Hello Swapstack');
  });

  it('respects RTL layout direction', () => {
    I18nManager.isRTL = true;
    render(<Text testID="rtl-text">مرحبا</Text>);

    expect(screen.getByTestId('rtl-text')).toHaveStyle({
      writingDirection: 'rtl',
    });
  });

  it('respects LTR layout direction', () => {
    I18nManager.isRTL = false;
    render(<Text testID="ltr-text">Hello</Text>);

    expect(screen.getByTestId('ltr-text')).toHaveStyle({
      writingDirection: 'ltr',
    });
  });
});
