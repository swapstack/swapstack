import { Link, Stack } from 'expo-router';

import { Text, View } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page not found' }} />
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="mb-4 text-center text-2xl font-bold text-foreground">Page not found</Text>
        <Text className="text-center text-base text-muted-foreground">The page you requested is unavailable or may have moved.</Text>
        <Link href="/" className="mt-6 py-3">
          <Text className="text-base font-semibold text-foreground underline">Return home</Text>
        </Link>
      </View>
    </>
  );
}
