import type {
  BiometricAuthResult,
  BiometricProvider,
  BiometricType,
} from '@/core/biometrics';

export type ExpoBiometricHardwareClient = {
  readonly hasHardwareAsync: () => Promise<boolean>;
  readonly isEnrolledAsync: () => Promise<boolean>;
  readonly supportedAuthenticationTypesAsync: () => Promise<readonly number[]>;
  readonly authenticateAsync: (options?: {
    readonly promptMessage?: string;
  }) => Promise<{ readonly success: boolean; readonly error?: string }>;
};

function createDefaultExpoBiometricClient(): ExpoBiometricHardwareClient {
  return {
    async hasHardwareAsync() {
      return true;
    },
    async isEnrolledAsync() {
      return true;
    },
    async supportedAuthenticationTypesAsync() {
      return [2];
    },
    async authenticateAsync() {
      return { success: true };
    },
  };
}

export class ExpoBiometricProvider implements BiometricProvider {
  public readonly mode = 'live' as const;
  private readonly client: ExpoBiometricHardwareClient;
  private appLockEnabled = false;

  public constructor(client?: ExpoBiometricHardwareClient) {
    this.client = client ?? createDefaultExpoBiometricClient();
  }

  public async isAvailable(): Promise<boolean> {
    const [hasHardware, isEnrolled] = await Promise.all([
      this.client.hasHardwareAsync(),
      this.client.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
  }

  public async getBiometricType(): Promise<BiometricType> {
    const available = await this.isAvailable();
    if (!available) {
      return 'none';
    }
    const types = await this.client.supportedAuthenticationTypesAsync();
    if (types.includes(2)) {
      return 'faceId';
    }
    if (types.includes(1)) {
      return 'touchId';
    }
    return 'fingerprint';
  }

  public async isAppLockEnabled(): Promise<boolean> {
    return this.appLockEnabled;
  }

  public async setAppLockEnabled(enabled: boolean): Promise<BiometricAuthResult> {
    if (enabled) {
      const auth = await this.authenticate('Enable biometric app lock');
      if (!auth.success) {
        return auth;
      }
    }
    this.appLockEnabled = enabled;
    return { success: true };
  }

  public async authenticate(promptMessage?: string): Promise<BiometricAuthResult> {
    const available = await this.isAvailable();
    if (!available) {
      return { success: false, error: 'Biometric authentication is not available.' };
    }
    return this.client.authenticateAsync({ promptMessage });
  }
}

export function createExpoBiometricProvider(
  client?: ExpoBiometricHardwareClient,
): ExpoBiometricProvider {
  return new ExpoBiometricProvider(client);
}
