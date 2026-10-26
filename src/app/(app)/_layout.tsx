import { Redirect, Stack } from 'expo-router';

import { AuthStatus } from '@/features/auth/components/auth-status';
import { useAuthSession } from '@/features/auth/session';

export default function AppLayout() {
  const { session, isLoading, error } = useAuthSession();

  if (isLoading || error) {
    return <AuthStatus error={error} />;
  }
  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
