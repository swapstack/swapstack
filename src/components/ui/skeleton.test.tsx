import * as React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import { Skeleton, SkeletonList } from './skeleton';

afterEach(cleanup);

describe('skeleton component', () => {
  it('renders a busy placeholder', () => {
    render(<Skeleton testID="sk" />);
    expect(screen.getByTestId('sk').props.accessibilityState).toEqual({ busy: true });
  });

  it('renders the requested number of list rows', () => {
    render(<SkeletonList testID="sk-list" rows={4} />);
    expect(screen.getAllByLabelText('Loading')).toHaveLength(12);
  });
});
