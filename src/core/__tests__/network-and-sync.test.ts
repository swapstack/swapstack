import type { DataRepository } from '../data';
import type { Profile } from '../types';
import { describeNetworkProviderContract } from '../contracts/network-provider.contract';
import { MockDataRepository } from '../mocks/mock-data-repository';
import { MockNetworkProvider } from '../mocks/mock-network-provider';
import { createOfflineAwareDataRepository } from '../sync-queue';

describe('network provider and offline sync queue', () => {
  describeNetworkProviderContract(() => new MockNetworkProvider());

  it('queues updates while offline and flushes them automatically when back online', async () => {
    const remote = new MockDataRepository<Profile>();
    const network = new MockNetworkProvider();
    const offlineRepo = createOfflineAwareDataRepository(remote, network);

    // Go offline
    network.setOnline(false);
    expect(await network.isOnline()).toBe(false);

    const optimistic = await offlineRepo.update('user_1', {
      displayName: 'Offline Traveler',
      email: 'traveler@swapstack.org',
    });
    expect(optimistic.displayName).toBe('Offline Traveler');
    expect(offlineRepo.getPendingCount()).toBe(1);
    expect(await remote.get('user_1')).toBeNull();

    // Cached read while still offline returns optimistic profile
    const cached = await offlineRepo.get('user_1');
    expect(cached?.displayName).toBe('Offline Traveler');

    // Reconnect and flush
    network.setOnline(true);
    await offlineRepo.flush();

    expect(offlineRepo.getPendingCount()).toBe(0);
    const synced = await remote.get('user_1');
    expect(synced?.displayName).toBe('Offline Traveler');
    expect(synced?.email).toBe('traveler@swapstack.org');

    offlineRepo.dispose();
  });

  it('retains failed mutations with incremented retry count and notifies on max retries', async () => {
    let failAttempts = 2;
    const inner = new MockDataRepository<Profile>();
    const flakyRemote: DataRepository<Profile> = {
      mode: 'mock',
      get: (id: string) => inner.get(id),
      subscribe: (id: string, cb) => inner.subscribe(id, cb),
      update: async (id: string, patch: Partial<Profile>) => {
        if (failAttempts > 0) {
          failAttempts -= 1;
          throw new Error('503 Service Unavailable');
        }
        return inner.update(id, patch);
      },
    };

    const network = new MockNetworkProvider();
    network.setOnline(false);

    const failedMutations: unknown[] = [];
    const offlineRepo = createOfflineAwareDataRepository(flakyRemote, network, {
      maxRetries: 3,
      onMutationFailed: (mutation, err) => {
        failedMutations.push({ mutation, err });
      },
    });

    await offlineRepo.update('u2', { displayName: 'Retry User' });
    expect(offlineRepo.getPendingCount()).toBe(1);

    // Reconnect: auto-flush triggers on status change and consumes 1st fail attempt
    network.setOnline(true);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(offlineRepo.getPendingCount()).toBe(1);
    expect(offlineRepo.getPendingMutations()[0]?.retryCount).toBe(1);
    expect(offlineRepo.getPendingMutations()[0]?.lastError).toBe('503 Service Unavailable');

    // Second flush attempt fails (consumes 2nd fail attempt)
    const secondFlushed = await offlineRepo.flush();
    expect(secondFlushed).toBe(0);
    expect(offlineRepo.getPendingCount()).toBe(1);
    expect(offlineRepo.getPendingMutations()[0]?.retryCount).toBe(2);

    // Third flush attempt succeeds because failAttempts is now 0
    const thirdFlushed = await offlineRepo.flush();
    expect(thirdFlushed).toBe(1);
    expect(offlineRepo.getPendingCount()).toBe(0);
    expect((await inner.get('u2'))?.displayName).toBe('Retry User');

    offlineRepo.dispose();
  });

  it('enqueues optimistically and notifies onMutationFailed when maxRetries is exceeded', async () => {
    const alwaysFailingRemote: DataRepository<Profile> = {
      mode: 'mock',
      get: async () => null,
      subscribe: () => () => {},
      update: async () => {
        throw new Error('Permanent 400 Bad Request');
      },
    };

    const network = new MockNetworkProvider();
    network.setOnline(true);

    const failedMutations: { mutation: unknown; error: unknown }[] = [];
    const offlineRepo = createOfflineAwareDataRepository(alwaysFailingRemote, network, {
      maxRetries: 1,
      onMutationFailed: (mutation, error) => {
        failedMutations.push({ mutation, error });
      },
    });

    // Remote fails while online -> falls back to optimistic update and queues
    const res = await offlineRepo.update('u3', { displayName: 'Always Fails' });
    expect(res.displayName).toBe('Always Fails');
    expect(offlineRepo.getPendingCount()).toBe(1);

    // Flush hits maxRetries (1), removes from queue and invokes onMutationFailed
    await offlineRepo.flush();
    expect(offlineRepo.getPendingCount()).toBe(0);
    expect(failedMutations).toHaveLength(1);

    offlineRepo.dispose();
  });
});
