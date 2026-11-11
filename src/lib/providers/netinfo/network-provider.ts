import type {
  NetworkConnectionType,
  NetworkProvider,
  NetworkStatus,
  NetworkStatusCallback,
} from '@/core/network';
import type { Unsubscribe } from '@/core/types';

export type NetInfoNativeState = {
  readonly isConnected: boolean | null;
  readonly isInternetReachable?: boolean | null;
  readonly type?: string;
};

export type NetInfoClientAdapter = {
  readonly fetch: () => Promise<NetInfoNativeState>;
  readonly addEventListener: (
    listener: (state: NetInfoNativeState) => void,
  ) => Unsubscribe;
};

function mapConnectionType(raw?: string): NetworkConnectionType {
  if (raw === 'wifi' || raw === 'cellular' || raw === 'ethernet' || raw === 'none') {
    return raw;
  }
  return 'unknown';
}

function toNetworkStatus(state: NetInfoNativeState): NetworkStatus {
  const isConnected = Boolean(state.isConnected);
  const isInternetReachable = state.isInternetReachable ?? isConnected;
  return {
    isConnected,
    isInternetReachable: Boolean(isInternetReachable),
    connectionType: mapConnectionType(state.type),
    updatedAt: new Date().toISOString(),
  };
}

function createDefaultNetInfoClient(): NetInfoClientAdapter {
  const listeners = new Set<(state: NetInfoNativeState) => void>();
  return {
    async fetch() {
      const online = typeof navigator !== 'undefined' && 'onLine' in navigator
        ? Boolean(navigator.onLine)
        : true;
      return {
        isConnected: online,
        isInternetReachable: online,
        type: online ? 'wifi' : 'none',
      };
    },
    addEventListener(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export class NetInfoNetworkProvider implements NetworkProvider {
  public readonly mode = 'live' as const;
  private readonly client: NetInfoClientAdapter;

  public constructor(client?: NetInfoClientAdapter) {
    this.client = client ?? createDefaultNetInfoClient();
  }

  public async getStatus(): Promise<NetworkStatus> {
    const raw = await this.client.fetch();
    return toNetworkStatus(raw);
  }

  public async isOnline(): Promise<boolean> {
    const status = await this.getStatus();
    return status.isConnected && status.isInternetReachable;
  }

  public onStatusChange(callback: NetworkStatusCallback): Unsubscribe {
    return this.client.addEventListener((state) => {
      callback(toNetworkStatus(state));
    });
  }
}

export function createNetInfoNetworkProvider(
  client?: NetInfoClientAdapter,
): NetInfoNetworkProvider {
  return new NetInfoNetworkProvider(client);
}
