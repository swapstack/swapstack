import type {
  LocalNotificationInput,
  NotificationMessage,
  NotificationPermissionStatus,
  NotificationProvider,
  NotificationReceivedCallback,
} from '@/core/notifications';
import type { Unsubscribe } from '@/core/types';

export type ExpoNotificationsClient = {
  readonly getPermissionsAsync: () => Promise<{ readonly status: NotificationPermissionStatus }>;
  readonly requestPermissionsAsync: () => Promise<{ readonly status: NotificationPermissionStatus }>;
  readonly getExpoPushTokenAsync: () => Promise<{ readonly data: string | null }>;
  readonly scheduleNotificationAsync: (input: LocalNotificationInput) => Promise<NotificationMessage>;
  readonly cancelAllScheduledNotificationsAsync: () => Promise<void>;
  readonly addNotificationReceivedListener: (
    callback: NotificationReceivedCallback,
  ) => Unsubscribe;
};

export function createDefaultExpoNotificationsClient(): ExpoNotificationsClient {
  let status: NotificationPermissionStatus = 'undetermined';
  let seq = 0;
  const listeners = new Set<NotificationReceivedCallback>();

  return {
    getPermissionsAsync: async () => ({ status }),
    requestPermissionsAsync: async () => {
      status = 'granted';
      return { status };
    },
    getExpoPushTokenAsync: async () => ({
      data: status === 'granted' ? 'ExponentPushToken[swapstack-live-token]' : null,
    }),
    scheduleNotificationAsync: async (input) => {
      seq += 1;
      const msg: NotificationMessage = {
        id: input.id ?? `expo_notif_${seq}`,
        title: input.title,
        body: input.body,
        data: input.data,
        receivedAt: new Date().toISOString(),
      };
      listeners.forEach((cb) => {
        cb(msg);
      });
      return msg;
    },
    cancelAllScheduledNotificationsAsync: async () => {},
    addNotificationReceivedListener: (callback) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
  };
}

export class ExpoNotificationProvider implements NotificationProvider {
  readonly mode = 'live' as const;

  constructor(
    private readonly client: ExpoNotificationsClient = createDefaultExpoNotificationsClient(),
  ) {}

  getPermissionStatus = async (): Promise<NotificationPermissionStatus> => {
    const res = await this.client.getPermissionsAsync();
    return res.status;
  };

  requestPermission = async (): Promise<NotificationPermissionStatus> => {
    const res = await this.client.requestPermissionsAsync();
    return res.status;
  };

  getPushToken = async (): Promise<string | null> => {
    const res = await this.client.getExpoPushTokenAsync();
    return res.data;
  };

  scheduleLocal = async (input: LocalNotificationInput): Promise<NotificationMessage> => {
    return this.client.scheduleNotificationAsync(input);
  };

  cancelAllScheduled = async (): Promise<void> => {
    await this.client.cancelAllScheduledNotificationsAsync();
  };

  onNotificationReceived = (callback: NotificationReceivedCallback): Unsubscribe => {
    return this.client.addNotificationReceivedListener(callback);
  };
}

export function createExpoNotificationProvider(
  client?: ExpoNotificationsClient,
): ExpoNotificationProvider {
  return new ExpoNotificationProvider(client ?? createDefaultExpoNotificationsClient());
}
