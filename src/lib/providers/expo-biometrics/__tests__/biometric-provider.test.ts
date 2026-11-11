import { describeBiometricProviderContract } from '@/core/contracts';
import { createExpoBiometricProvider } from '../biometric-provider';

describeBiometricProviderContract(() => createExpoBiometricProvider());
