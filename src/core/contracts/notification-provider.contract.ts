import type { NotificationProvider } from '../notifications';

export function describeNotificationProviderContract(
  createProvider: () => Promise<NotificationProvider> | NotificationProvider,
) {
  describe('notification provider contract', () => {
    let provider: NotificationProvider;

    beforeEach(async () => {
      provider = await createProvider();
    });

    it('requests permissions and resolves a push token when granted', async () => {
      const initial = await provider.getPermissionStatus();
      expect(['undetermined', 'granted', 'denied']).toContain(initial);

      const granted = await provider.requestPermission();
      expect(granted).toBe('granted');

      const token = await provider.getPushToken();
      expect(typeof token).toBe('string');
      expect(token?.length).toBeGreaterThan(0);
    });

    it('schedules local notifications and notifies listeners until unsubscribed', async () => {
      const listener = jest.fn();
      const unsubscribe = provider.onNotificationReceived(listener);

      const scheduled = await provider.scheduleLocal({
        title: 'Daily Streak',
        body: 'Keep your workout streak alive!',
        data: { route: '/(app)' },
      });

      expect(scheduled.title).toBe('Daily Streak');
      expect(scheduled.body).toBe('Keep your workout streak alive!');
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(scheduled);

      unsubscribe();
      await provider.scheduleLocal({
        title: 'Second Alert',
        body: 'Should not trigger unsubscribed listener',
      });
      expect(listener).toHaveBeenCalledTimes(1);

      await provider.cancelAllScheduled();
    });
  });
}
