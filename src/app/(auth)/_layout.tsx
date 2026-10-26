import { Redirect, Stack, useSegments } from 'expo-router';

import { AuthStatus } from '@/features/auth/components/auth-status';
import { useAuthSession } from '@/features/auth/session';

export default function AuthLayout() {
  const { session, isLoading, error, retry } = useAuthSession();
  const segments = useSegments();
  const currentRoute = segments.at(-1);
  const isAccountUpgrade = currentRoute === 'link-account';
  const isVerificationPending = currentRoute === 'email-verification-pending';

  if (isLoading || error) {
    return <AuthStatus error={error} onRetry={retry} />;
  }
  if (session && !isAccountUpgrade && !isVerificationPending) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
