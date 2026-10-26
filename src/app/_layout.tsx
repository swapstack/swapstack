import { Stack } from 'expo-router';

import { AuthSessionProvider } from '@/features/auth/session';
import { validateProviderConfig } from '@/lib/providers';
import '../global.css';

validateProviderConfig();

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthSessionProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthSessionProvider>
  );
}
