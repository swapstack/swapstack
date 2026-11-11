import type { BiometricProvider } from '../biometrics';

export function describeBiometricProviderContract(
  createProvider: () => Promise<BiometricProvider> | BiometricProvider,
) {
  describe('biometric provider contract', () => {
    let biometrics: BiometricProvider;

    beforeEach(async () => {
      biometrics = await createProvider();
    });

    it('reports hardware availability, biometric type, and authenticates app lock', async () => {
      const available = await biometrics.isAvailable();
      expect(typeof available).toBe('boolean');

      const type = await biometrics.getBiometricType();
      expect(['faceId', 'touchId', 'fingerprint', 'none']).toContain(type);

      expect(await biometrics.isAppLockEnabled()).toBe(false);

      const enabledRes = await biometrics.setAppLockEnabled(true);
      expect(enabledRes.success).toBe(true);
      expect(await biometrics.isAppLockEnabled()).toBe(true);

      const authRes = await biometrics.authenticate('Unlock Swapstack');
      expect(authRes.success).toBe(true);

      await biometrics.setAppLockEnabled(false);
      expect(await biometrics.isAppLockEnabled()).toBe(false);
    });
  });
}
