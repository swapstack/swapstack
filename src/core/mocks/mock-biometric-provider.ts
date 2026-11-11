import type {
  BiometricAuthResult,
  BiometricProvider,
  BiometricType,
} from '../biometrics';

export class MockBiometricProvider implements BiometricProvider {
  readonly mode = 'mock' as const;
  private available = true;
  private biometricType: BiometricType = 'faceId';
  private appLockEnabled = false;
  private nextResult: BiometricAuthResult = { success: true };

  isAvailable = async (): Promise<boolean> => {
    return this.available;
  };

  getBiometricType = async (): Promise<BiometricType> => {
    return this.biometricType;
  };

  isAppLockEnabled = async (): Promise<boolean> => {
    return this.appLockEnabled;
  };

  setAppLockEnabled = async (enabled: boolean): Promise<BiometricAuthResult> => {
    if (enabled) {
      const auth = await this.authenticate('Confirm biometrics to enable app lock');
      if (!auth.success) {
        return auth;
      }
    }
    this.appLockEnabled = enabled;
    return { success: true };
  };

  authenticate = async (_promptMessage?: string): Promise<BiometricAuthResult> => {
    if (!this.available) {
      return { success: false, error: 'Biometrics not available on this device.' };
    }
    return this.nextResult;
  };

  setNextAuthResult(result: BiometricAuthResult): void {
    this.nextResult = result;
  }

  reset(): void {
    this.available = true;
    this.biometricType = 'faceId';
    this.appLockEnabled = false;
    this.nextResult = { success: true };
  }
}
