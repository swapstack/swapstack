import type { NetworkProvider } from '@/core/network';
import * as React from 'react';
import { View } from 'react-native';
import { Text } from './text';

export type OfflineBannerProps = {
  readonly network: NetworkProvider;
  readonly pendingMutationsCount?: number;
};

export function OfflineBanner({
  network,
  pendingMutationsCount = 0,
}: OfflineBannerProps) {
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    void network.isOnline().then((online) => {
      if (mounted) {
        setIsOnline(online);
      }
    });

    const unsubscribe = network.onStatusChange((status) => {
      if (mounted) {
        setIsOnline(status.isConnected && status.isInternetReachable);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [network]);

  if (isOnline && pendingMutationsCount === 0) {
    return null;
  }

  const label = !isOnline
    ? pendingMutationsCount > 0
      ? `You are offline · ${pendingMutationsCount} change(s) queued`
      : 'You are offline · Changes will sync when reconnected'
    : `Syncing ${pendingMutationsCount} queued change(s)...`;

  return (
    <View
      testID="offline-banner"
      className="rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <Text className="text-center font-medium text-xs">{label}</Text>
    </View>
  );
}
