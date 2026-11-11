export type BiometricType = 'faceId' | 'touchId' | 'fingerprint' | 'none';

export type BiometricAuthResult = {
  readonly success: boolean;
  readonly error?: string;
};

export type BiometricProvider = {
  readonly mode?: 'mock' | 'live';
  readonly isAvailable: () => Promise<boolean>;
  readonly getBiometricType: () => Promise<BiometricType>;
  readonly isAppLockEnabled: () => Promise<boolean>;
  readonly setAppLockEnabled: (enabled: boolean) => Promise<BiometricAuthResult>;
  readonly authenticate: (promptMessage?: string) => Promise<BiometricAuthResult>;
};
