import type { Profile, Unsubscribe } from './types';

export type DataChangeCallback<T> = (data: T | null) => void;

export type DataRepository<T = Profile> = {
  readonly mode?: 'mock' | 'live';
  readonly get: (id: string) => Promise<T | null>;
  readonly update: (id: string, data: Partial<T>) => Promise<T>;
  readonly subscribe: (id: string, callback: DataChangeCallback<T>) => Unsubscribe;
};
