import { Stack } from 'expo-router';

import { validateProviderConfig } from '@/lib/providers';
import '../global.css';

validateProviderConfig();

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
