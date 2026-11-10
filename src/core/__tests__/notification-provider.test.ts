import { describeNotificationProviderContract } from '../contracts/notification-provider.contract';
import { MockNotificationProvider } from '../mocks/mock-notification-provider';

describe('mock notification provider contracts', () => {
  describeNotificationProviderContract(() => new MockNotificationProvider());

  it('returns null push token before permission is granted', async () => {
    const provider = new MockNotificationProvider();
    expect(await provider.getPushToken()).toBeNull();
  });
});
