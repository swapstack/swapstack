import { Stack } from 'expo-router';

import '../global.css';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
