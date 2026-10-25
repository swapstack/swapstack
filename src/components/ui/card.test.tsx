import * as React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';
import { Text } from './text';

afterEach(cleanup);

describe('card component', () => {
  it('renders card container correctly', () => {
    render(
      <Card testID="test-card">
        <Text>Card body</Text>
      </Card>,
    );
    expect(screen.getByTestId('test-card')).toBeOnTheScreen();
    expect(screen.getByText('Card body')).toBeOnTheScreen();
  });

  it('renders complete card with all sections', () => {
    render(
      <Card testID="profile-card">
        <CardHeader testID="card-header">
          <CardTitle testID="card-title">Profile Settings</CardTitle>
          <CardDescription testID="card-desc">Manage your account information</CardDescription>
        </CardHeader>
        <CardContent testID="card-content">
          <Text>Content details here</Text>
        </CardContent>
        <CardFooter testID="card-footer">
          <Text>Footer action</Text>
        </CardFooter>
      </Card>,
    );

    expect(screen.getByTestId('profile-card')).toBeOnTheScreen();
    expect(screen.getByTestId('card-header')).toBeOnTheScreen();
    expect(screen.getByTestId('card-title')).toHaveTextContent('Profile Settings');
    expect(screen.getByTestId('card-desc')).toHaveTextContent('Manage your account information');
    expect(screen.getByTestId('card-content')).toBeOnTheScreen();
    expect(screen.getByTestId('card-footer')).toBeOnTheScreen();
    expect(screen.getByText('Content details here')).toBeOnTheScreen();
    expect(screen.getByText('Footer action')).toBeOnTheScreen();
  });
});
