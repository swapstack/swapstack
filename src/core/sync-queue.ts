import type { DataRepository } from './data';
import type { NetworkProvider } from './network';
import type { Unsubscribe } from './types';

export type QueuedMutation<T> = {
  readonly id: string;
  readonly patch: Partial<T>;
  readonly queuedAt: string;
};

export class OfflineSyncQueue<T extends { readonly id: string }> implements DataRepository<T> {
  readonly mode: 'mock' | 'live';
  private readonly cache = new Map<string, T>();
  private readonly queue: QueuedMutation<T>[] = [];
  private readonly listeners = new Map<string, Set<(data: T | null) => void>>();
  private readonly unsubscribeNetwork: Unsubscribe;

  constructor(
    private readonly remote: DataRepository<T>,
    private readonly network: NetworkProvider,
  ) {
    this.mode = remote.mode ?? 'live';
    this.unsubscribeNetwork = this.network.onStatusChange((status) => {
      if (status.isConnected && status.isInternetReachable) {
        void this.flush();
      }
    });
  }

  getPendingCount(): number {
    return this.queue.length;
  }

  getPendingMutations(): readonly QueuedMutation<T>[] {
    return [...this.queue];
  }

  get = async (id: string): Promise<T | null> => {
    const online = await this.network.isOnline();
    if (!online) {
      return this.cache.get(id) ?? null;
    }
    const fresh = await this.remote.get(id);
    if (fresh) {
      this.cache.set(id, fresh);
    }
    return fresh;
  };

  update = async (id: string, data: Partial<T>): Promise<T> => {
    const online = await this.network.isOnline();
    const existing = this.cache.get(id) ?? ({ id } as unknown as T);
    const optimistic = {
      ...existing,
      ...data,
      id,
    } as T;
    this.cache.set(id, optimistic);

    if (!online) {
      this.queue.push({
        id,
        patch: data,
        queuedAt: new Date().toISOString(),
      });
      this.notify(id, optimistic);
      return optimistic;
    }

    const saved = await this.remote.update(id, data);
    this.cache.set(id, saved);
    this.notify(id, saved);
    return saved;
  };

  flush = async (): Promise<number> => {
    const online = await this.network.isOnline();
    if (!online || this.queue.length === 0) {
      return 0;
    }
    const items = this.queue.splice(0, this.queue.length);
    let flushedCount = 0;
    for (const item of items) {
      const saved = await this.remote.update(item.id, item.patch);
      this.cache.set(item.id, saved);
      this.notify(item.id, saved);
      flushedCount += 1;
    }
    return flushedCount;
  };

  subscribe = (id: string, callback: (data: T | null) => void): Unsubscribe => {
    const set = this.listeners.get(id) ?? new Set();
    set.add(callback);
    this.listeners.set(id, set);
    const remoteUnsub = this.remote.subscribe(id, (data) => {
      if (data) {
        this.cache.set(id, data);
      }
      callback(data);
    });
    return () => {
      set.delete(callback);
      remoteUnsub();
    };
  };

  dispose(): void {
    this.unsubscribeNetwork();
  }

  private notify(id: string, value: T | null): void {
    this.listeners.get(id)?.forEach((cb) => {
      cb(value);
    });
  }
}

export function createOfflineAwareDataRepository<T extends { readonly id: string }>(
  remote: DataRepository<T>,
  network: NetworkProvider,
): OfflineSyncQueue<T> {
  return new OfflineSyncQueue(remote, network);
}
