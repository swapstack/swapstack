import { describeDataRepositoryContract } from '../contracts/data-repository.contract';
import { MockDataRepository } from '../mocks/mock-data-repository';

type NestedProfile = {
  readonly id: string;
  readonly updatedAt?: string;
  preferences: {
    theme: string;
    notifications: { email: boolean };
  };
};

describe('mockDataRepository Contract Suite', () => {
  describeDataRepositoryContract(() => new MockDataRepository());

  describe('deep copy on read and write', () => {
    it('deep-copies nested records on write so external mutations do not affect repository', async () => {
      const repo = new MockDataRepository<NestedProfile>();
      const payload: Partial<NestedProfile> = {
        preferences: {
          theme: 'dark',
          notifications: { email: true },
        },
      };

      const created = await repo.update('user_1', payload);
      expect(created.preferences.theme).toBe('dark');

      // Mutate the original argument object
      payload.preferences!.theme = 'light';
      payload.preferences!.notifications.email = false;

      const fetched = await repo.get('user_1');
      expect(fetched?.preferences.theme).toBe('dark');
      expect(fetched?.preferences.notifications.email).toBe(true);
    });

    it('deep-copies nested records on read so mutations to returned object do not affect repository', async () => {
      const repo = new MockDataRepository<NestedProfile>();
      await repo.update('user_1', {
        preferences: {
          theme: 'dark',
          notifications: { email: true },
        },
      });

      const fetched1 = await repo.get('user_1');
      expect(fetched1).not.toBeNull();
      fetched1!.preferences.theme = 'neon';
      fetched1!.preferences.notifications.email = false;

      const fetched2 = await repo.get('user_1');
      expect(fetched2?.preferences.theme).toBe('dark');
      expect(fetched2?.preferences.notifications.email).toBe(true);
    });
  });
});
