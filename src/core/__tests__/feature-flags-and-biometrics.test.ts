import { describeBiometricProviderContract } from '../contracts/biometric-provider.contract';
import { describeFeatureFlagProviderContract } from '../contracts/feature-flag-provider.contract';
import { MockBiometricProvider } from '../mocks/mock-biometric-provider';
import { MockFeatureFlagProvider } from '../mocks/mock-feature-flag-provider';

describe('feature flags and biometrics contracts', () => {
  describeFeatureFlagProviderContract(() => new MockFeatureFlagProvider());
  describeBiometricProviderContract(() => new MockBiometricProvider());
});
