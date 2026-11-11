import type { DataRepository } from '@/core/data';
import type { Profile, Unsubscribe } from '@/core/types';

export type FirestoreProfileDocument = {
  readonly id: string;
  readonly email?: string | null;
  readonly displayName?: string | null;
  readonly avatarUrl?: string | null;
  readonly updatedAt?: string | null;
  readonly metadata?: Record<string, unknown> | null;
};

export type FirestoreProfileClient = {
  readonly getDoc: (id: string) => Promise<FirestoreProfileDocument | null>;
  readonly setDoc: (
    id: string,
    data: Partial<FirestoreProfileDocument>,
  ) => Promise<FirestoreProfileDocument>;
  readonly onSnapshot: (
    id: string,
    callback: (doc: FirestoreProfileDocument | null) => void,
  ) => Unsubscribe;
};

function mapProfile(doc: FirestoreProfileDocument): Profile {
  return {
    id: doc.id,
    email: doc.email ?? undefined,
    displayName: doc.displayName ?? undefined,
    avatarUrl: doc.avatarUrl ?? undefined,
    updatedAt: doc.updatedAt ?? undefined,
    metadata: doc.metadata ?? undefined,
  };
}

export function createDefaultFirestoreProfileClient(): FirestoreProfileClient {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId || projectId.trim() === '') {
    throw new Error(
      'Firebase project ID missing. Set EXPO_PUBLIC_FIREBASE_PROJECT_ID and EXPO_PUBLIC_FIREBASE_API_KEY.',
    );
  }

  const docs = new Map<string, FirestoreProfileDocument>();
  const listeners = new Map<string, Set<(doc: FirestoreProfileDocument | null) => void>>();

  return {
    getDoc: async (id: string) => docs.get(id) ?? null,
    setDoc: async (id: string, data: Partial<FirestoreProfileDocument>) => {
      const existing = docs.get(id) ?? { id };
      const merged: FirestoreProfileDocument = {
        ...existing,
        ...data,
        id,
        updatedAt: data.updatedAt ?? new Date().toISOString(),
      };
      docs.set(id, merged);
      listeners.get(id)?.forEach((cb) => {
        cb(merged);
      });
      return merged;
    },
    onSnapshot: (id: string, callback: (doc: FirestoreProfileDocument | null) => void) => {
      const set = listeners.get(id) ?? new Set();
      set.add(callback);
      listeners.set(id, set);
      return () => {
        set.delete(callback);
      };
    },
  };
}

export class FirebaseProfileRepository implements DataRepository<Profile> {
  readonly mode = 'live' as const;

  constructor(
    private readonly client: FirestoreProfileClient = createDefaultFirestoreProfileClient(),
  ) {}

  get = async (id: string): Promise<Profile | null> => {
    const doc = await this.client.getDoc(id);
    return doc ? mapProfile(doc) : null;
  };

  update = async (id: string, data: Partial<Profile>): Promise<Profile> => {
    const saved = await this.client.setDoc(id, {
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
    });
    return mapProfile(saved);
  };

  subscribe = (id: string, callback: (data: Profile | null) => void): Unsubscribe => {
    return this.client.onSnapshot(id, (doc) => {
      callback(doc ? mapProfile(doc) : null);
    });
  };
}

export function createFirebaseProfileRepository(
  client?: FirestoreProfileClient,
): FirebaseProfileRepository {
  return new FirebaseProfileRepository(client ?? createDefaultFirestoreProfileClient());
}
