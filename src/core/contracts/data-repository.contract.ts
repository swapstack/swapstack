import type { DataRepository } from '../data';
import type { Profile } from '../types';

export function describeDataRepositoryContract(
  createRepo: () => Promise<DataRepository<Profile>> | DataRepository<Profile>,
) {
  describe('data repository contract', () => {
    let repo: DataRepository<Profile>;

    beforeEach(async () => {
      repo = await createRepo();
    });

    it('returns null when record does not exist', async () => {
      const profile = await repo.get('non_existent_id');
      expect(profile).toBeNull();
    });

    it('creates or updates a record and returns it', async () => {
      const created = await repo.update('profile_1', {
        displayName: 'Dev User',
        email: 'dev@swapstack.org',
      });

      expect(created.id).toBe('profile_1');
      expect(created.displayName).toBe('Dev User');
      expect(created.email).toBe('dev@swapstack.org');

      const fetched = await repo.get('profile_1');
      expect(fetched).toEqual(created);
    });

    it('merges updates with existing data', async () => {
      await repo.update('profile_2', {
        displayName: 'Initial Name',
        metadata: { bio: 'Coder' },
      });
      const updated = await repo.update('profile_2', { displayName: 'Updated Name' });

      expect(updated.displayName).toBe('Updated Name');
      expect(updated.metadata).toEqual({ bio: 'Coder' });
    });

    it('notifies subscribers of targeted record updates', async () => {
      const subscriber = jest.fn();
      const unsubscribe = repo.subscribe('profile_3', subscriber);

      const saved = await repo.update('profile_3', { displayName: 'Live Profile' });
      expect(subscriber).toHaveBeenCalledWith(saved);

      await repo.update('profile_other', { displayName: 'Other Profile' });
      expect(subscriber).toHaveBeenCalledTimes(1);

      unsubscribe();
      await repo.update('profile_3', { displayName: 'After Unsubscribe' });
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });
}
