import * as React from 'react';

import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { EmptyState } from './empty-state';

afterEach(cleanup);

describe('empty state component', () => {
  it('renders title, description, and fires the action', () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        testID="empty"
        title="No workouts yet"
        description="Log your first session to start a streak."
        actionLabel="Log workout"
        onAction={onAction}
      />,
    );

    expect(screen.getByText('No workouts yet')).toBeOnTheScreen();
    expect(screen.getByText('Log your first session to start a streak.')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('empty-action'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('omits the action button when no handler is provided', () => {
    render(<EmptyState testID="empty" title="Nothing here" actionLabel="Ignored" />);
    expect(screen.queryByTestId('empty-action')).toBeNull();
  });
});
