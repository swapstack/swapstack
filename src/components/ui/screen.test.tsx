import * as React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import { Screen } from './screen';
import { Text } from './text';

afterEach(cleanup);

describe('screen component', () => {
  it('renders fixed screen correctly', () => {
    render(
      <Screen testID="screen-fixed">
        <Text>Screen content</Text>
      </Screen>,
    );

    expect(screen.getByTestId('screen-fixed')).toBeOnTheScreen();
    expect(screen.getByText('Screen content')).toBeOnTheScreen();
  });

  it('renders scrollable screen correctly', () => {
    render(
      <Screen testID="screen-scrollable" scrollable={true}>
        <Text>Scrollable item 1</Text>
        <Text>Scrollable item 2</Text>
      </Screen>,
    );

    expect(screen.getByTestId('screen-scrollable')).toBeOnTheScreen();
    expect(screen.getByText('Scrollable item 1')).toBeOnTheScreen();
    expect(screen.getByText('Scrollable item 2')).toBeOnTheScreen();
  });
});
