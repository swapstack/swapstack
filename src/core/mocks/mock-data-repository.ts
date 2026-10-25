import type { DataChangeCallback, DataRepository } from '../data';
import type { Profile, Unsubscribe } from '../types';

export class MockDataRepository<T extends { readonly id: string; readonly updatedAt?: string } = Profile>
implements DataRepository<T> {
  readonly mode = 'mock' as const;
  private readonly store = new Map<string, T>();
  private readonly listeners = new Map<string, Set<DataChangeCallback<T>>>();

  constructor(initialData: T[] = []) {
    for (const item of initialData) {
      this.store.set(item.id, structuredClone(item));
    }
  }

  readonly get = async (id: string): Promise<T | null> => {
    const item = this.store.get(id);
    return item ? structuredClone(item) : null;
  };

  readonly update = async (id: string, data: Partial<T>): Promise<T> => {
    const existing = this.store.get(id) ?? ({ id } as unknown as T);
    const updated: T = {
      ...structuredClone(existing),
      ...structuredClone(data as T),
      id,
      updatedAt: new Date().toISOString(),
    };

    this.store.set(id, structuredClone(updated));
    this.notifySubscribers(id, updated);
    return structuredClone(updated);
  };

  readonly subscribe = (id: string, callback: DataChangeCallback<T>): Unsubscribe => {
    let idListeners = this.listeners.get(id);
    if (!idListeners) {
      idListeners = new Set();
      this.listeners.set(id, idListeners);
    }
    idListeners.add(callback);

    return () => {
      const set = this.listeners.get(id);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(id);
        }
      }
    };
  };

  readonly reset = (initialData: T[] = []): void => {
    this.store.clear();
    this.listeners.clear();
    for (const item of initialData) {
      this.store.set(item.id, structuredClone(item));
    }
  };

  private notifySubscribers(id: string, data: T | null): void {
    const idListeners = this.listeners.get(id);
    if (idListeners) {
      for (const callback of idListeners) {
        try {
          callback(data ? structuredClone(data) : null);
        }
        catch (error) {
          console.warn('MockDataRepository subscriber threw an error:', error);
        }
      }
    }
  }
}
