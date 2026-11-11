import { describeNotificationProviderContract } from '@/core/contracts/notification-provider.contract';
import {
  createDefaultExpoNotificationsClient,
  createExpoNotificationProvider,
} from '../notification-provider';

describe('expo notification provider', () => {
  describeNotificationProviderContract(() =>
    createExpoNotificationProvider(createDefaultExpoNotificationsClient()),
  );
});
