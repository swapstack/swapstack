import type { FirestoreProfileClient, FirestoreProfileDocument } from '../profile-repository';
import { describeDataRepositoryContract } from '@/core/contracts/data-repository.contract';
import { createFirebaseProfileRepository } from '../profile-repository';

function createFakeFirestoreClient(): FirestoreProfileClient {
  const docs = new Map<string, FirestoreProfileDocument>();
  const listeners = new Map<string, Set<(doc: FirestoreProfileDocument | null) => void>>();

  return {
    getDoc: jest.fn(async (id: string) => docs.get(id) ?? null),
    setDoc: jest.fn(async (id: string, data: Partial<FirestoreProfileDocument>) => {
      const existing = docs.get(id) ?? { id };
      const merged: FirestoreProfileDocument = {
        ...existing,
        ...data,
        id,
      };
      docs.set(id, merged);
      listeners.get(id)?.forEach((cb) => {
        cb(merged);
      });
      return merged;
    }),
    onSnapshot: jest.fn((id: string, callback: (doc: FirestoreProfileDocument | null) => void) => {
      const set = listeners.get(id) ?? new Set();
      set.add(callback);
      listeners.set(id, set);
      return () => {
        set.delete(callback);
      };
    }),
  };
}

describe('firebaseProfileRepository', () => {
  describeDataRepositoryContract(() =>
    createFirebaseProfileRepository(createFakeFirestoreClient()),
  );
});
