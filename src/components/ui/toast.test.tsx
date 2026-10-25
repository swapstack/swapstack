import * as React from 'react';
import { showMessage } from 'react-native-flash-message';

import { cleanup, render, screen, setup } from '@/lib/test-utils';

import { Toast, toast } from './toast';

jest.mock('react-native-flash-message', () => {
  return {
    __esModule: true,
    default: () => null,
    showMessage: jest.fn(),
  };
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('toast component', () => {
  it('renders message and description correctly', () => {
    render(
      <Toast
        testID="app-toast"
        message="Changes saved"
        description="Your profile was updated successfully"
      />,
    );

    expect(screen.getByTestId('app-toast')).toBeOnTheScreen();
    expect(screen.getByTestId('app-toast-message')).toHaveTextContent('Changes saved');
    expect(screen.getByTestId('app-toast-description')).toHaveTextContent(
      'Your profile was updated successfully',
    );
  });

  it('triggers onClose when close button is pressed', async () => {
    const onClose = jest.fn();
    const { user } = setup(
      <Toast
        testID="closable-toast"
        message="Dismissible alert"
        onClose={onClose}
      />,
    );

    const closeBtn = screen.getByTestId('closable-toast-close');
    expect(closeBtn).toBeOnTheScreen();

    await user.press(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dispatches toast messages via helper methods', () => {
    toast.success('Saved successfully', 'Details');
    expect(showMessage).toHaveBeenCalledWith({
      message: 'Saved successfully',
      description: 'Details',
      type: 'success',
      duration: 3000,
    });

    toast.error('An error occurred');
    expect(showMessage).toHaveBeenCalledWith({
      message: 'An error occurred',
      description: undefined,
      type: 'danger',
      duration: 3000,
    });
  });
});
