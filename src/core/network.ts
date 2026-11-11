import type { Unsubscribe } from './types';

export type NetworkConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown';

export type NetworkStatus = {
  readonly isConnected: boolean;
  readonly isInternetReachable: boolean;
  readonly connectionType: NetworkConnectionType;
  readonly updatedAt: string;
};

export type NetworkStatusCallback = (status: NetworkStatus) => void;

export type NetworkProvider = {
  readonly mode?: 'mock' | 'live';
  readonly getStatus: () => Promise<NetworkStatus>;
  readonly isOnline: () => Promise<boolean>;
  readonly onStatusChange: (callback: NetworkStatusCallback) => Unsubscribe;
};
