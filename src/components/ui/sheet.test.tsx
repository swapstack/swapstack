import * as React from 'react';

import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { Sheet } from './sheet';
import { Text } from './text';

afterEach(cleanup);

describe('sheet component', () => {
  it('renders title and content when visible and closes via backdrop', () => {
    const onClose = jest.fn();
    render(
      <Sheet testID="sheet" visible title="Choose plan" onClose={onClose}>
        <Text>Sheet body</Text>
      </Sheet>,
    );

    expect(screen.getByText('Choose plan')).toBeOnTheScreen();
    expect(screen.getByText('Sheet body')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render content when hidden', () => {
    render(
      <Sheet testID="sheet" visible={false} onClose={jest.fn()}>
        <Text>Hidden body</Text>
      </Sheet>,
    );
    expect(screen.queryByText('Hidden body')).toBeNull();
  });
});
