import type {
  LocalNotificationInput,
  NotificationMessage,
  NotificationPermissionStatus,
  NotificationProvider,
  NotificationReceivedCallback,
} from '../notifications';
import type { Unsubscribe } from '../types';

export class MockNotificationProvider implements NotificationProvider {
  readonly mode = 'mock' as const;
  private permissionStatus: NotificationPermissionStatus = 'undetermined';
  private scheduled: NotificationMessage[] = [];
  private readonly listeners = new Set<NotificationReceivedCallback>();
  private counter = 0;

  readonly getPermissionStatus = async (): Promise<NotificationPermissionStatus> => {
    return this.permissionStatus;
  };

  readonly requestPermission = async (): Promise<NotificationPermissionStatus> => {
    this.permissionStatus = 'granted';
    return this.permissionStatus;
  };

  readonly getPushToken = async (): Promise<string | null> => {
    if (this.permissionStatus !== 'granted') {
      return null;
    }
    return 'ExponentPushToken[mock-token-001]';
  };

  readonly scheduleLocal = async (
    input: LocalNotificationInput,
  ): Promise<NotificationMessage> => {
    this.counter += 1;
    const message: NotificationMessage = {
      id: input.id ?? `notif_${this.counter}`,
      title: input.title,
      body: input.body,
      data: input.data ? { ...input.data } : undefined,
      receivedAt: new Date().toISOString(),
    };
    this.scheduled.push(structuredClone(message));
    this.notifyListeners(message);
    return structuredClone(message);
  };

  readonly cancelAllScheduled = async (): Promise<void> => {
    this.scheduled = [];
  };

  readonly onNotificationReceived = (
    callback: NotificationReceivedCallback,
  ): Unsubscribe => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  readonly getScheduledNotifications = (): NotificationMessage[] => {
    return this.scheduled.map(n => structuredClone(n));
  };

  readonly setPermissionStatus = (status: NotificationPermissionStatus): void => {
    this.permissionStatus = status;
  };

  readonly reset = (): void => {
    this.permissionStatus = 'undetermined';
    this.scheduled = [];
    this.listeners.clear();
    this.counter = 0;
  };

  private notifyListeners(message: NotificationMessage): void {
    for (const listener of this.listeners) {
      try {
        listener(structuredClone(message));
      }
      catch (error) {
        console.warn('MockNotificationProvider listener threw an error:', error);
      }
    }
  }
}
