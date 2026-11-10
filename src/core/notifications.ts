import type { Unsubscribe } from './types';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export type LocalNotificationInput = {
  readonly id?: string;
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, string>;
  readonly triggerSeconds?: number;
};

export type NotificationMessage = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, string>;
  readonly receivedAt: string;
};

export type NotificationReceivedCallback = (notification: NotificationMessage) => void;

export type NotificationProvider = {
  readonly mode?: 'mock' | 'live';
  readonly getPermissionStatus: () => Promise<NotificationPermissionStatus>;
  readonly requestPermission: () => Promise<NotificationPermissionStatus>;
  readonly getPushToken: () => Promise<string | null>;
  readonly scheduleLocal: (input: LocalNotificationInput) => Promise<NotificationMessage>;
  readonly cancelAllScheduled: () => Promise<void>;
  readonly onNotificationReceived: (callback: NotificationReceivedCallback) => Unsubscribe;
};
