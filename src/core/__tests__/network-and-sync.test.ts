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
});
