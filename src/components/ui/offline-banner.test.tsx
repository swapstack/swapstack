import { act, render, screen, waitFor } from '@testing-library/react-native';
import * as React from 'react';
import { MockNetworkProvider } from '@/core/mocks/mock-network-provider';
import { OfflineBanner } from './offline-banner';

describe('offlineBanner', () => {
  it('hides when online and displays when offline', async () => {
    const network = new MockNetworkProvider();
    render(<OfflineBanner network={network} pendingMutationsCount={0} />);

    expect(screen.queryByTestId('offline-banner')).toBeNull();

    act(() => {
      network.setOnline(false);
    });

    await waitFor(() => {
      expect(screen.getByTestId('offline-banner')).toBeTruthy();
      expect(
        screen.getByText('You are offline · Changes will sync when reconnected'),
      ).toBeTruthy();
    });

    act(() => {
      network.setOnline(true);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('offline-banner')).toBeNull();
    });
  });
});
