import type {
  NetworkConnectionType,
  NetworkProvider,
  NetworkStatus,
  NetworkStatusCallback,
} from '../network';
import type { Unsubscribe } from '../types';

export class MockNetworkProvider implements NetworkProvider {
  readonly mode = 'mock' as const;
  private status: NetworkStatus = {
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'wifi',
    updatedAt: new Date(0).toISOString(),
  };

  private readonly listeners = new Set<NetworkStatusCallback>();

  getStatus = async (): Promise<NetworkStatus> => {
    return this.status;
  };

  isOnline = async (): Promise<boolean> => {
    return this.status.isConnected && this.status.isInternetReachable;
  };

  onStatusChange = (callback: NetworkStatusCallback): Unsubscribe => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  setOnline(online: boolean, connectionType: NetworkConnectionType = online ? 'wifi' : 'none'): void {
    this.status = {
      isConnected: online,
      isInternetReachable: online,
      connectionType,
      updatedAt: new Date().toISOString(),
    };
    this.listeners.forEach((cb) => {
      cb(this.status);
    });
  }

  reset(): void {
    this.status = {
      isConnected: true,
      isInternetReachable: true,
      connectionType: 'wifi',
      updatedAt: new Date(0).toISOString(),
    };
    this.listeners.clear();
  }
}
