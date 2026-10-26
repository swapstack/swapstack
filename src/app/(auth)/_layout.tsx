import { Redirect, Stack, useSegments } from 'expo-router';

import { AuthStatus } from '@/features/auth/components/auth-status';
import { useAuthSession } from '@/features/auth/session';

export default function AuthLayout() {
  const { session, isLoading, error, retry } = useAuthSession();
  const segments = useSegments();
  const isAccountUpgrade = segments.at(-1) === 'link-account';

  if (isLoading || error) {
    return <AuthStatus error={error} onRetry={retry} />;
  }
  if (session && !isAccountUpgrade) {
    return <Redirect href="/" />;
  }
  if (!session && isAccountUpgrade) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
