import { Link } from 'expo-router';

import { Button, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { serviceProviders } from '@/lib/services';

export default function HomeScreen() {
  const backendMode = serviceProviders.backend.mode;
  const billingMode = serviceProviders.billing.mode;
  const isMock = backendMode === 'mock' && billingMode === 'mock';

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-charcoal-950">
      <FocusAwareStatusBar />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-4xl font-bold">Welcome</Text>
        <Text className="mt-3 text-center text-lg text-neutral-600 dark:text-neutral-300">
          A flexible Expo foundation for your next app.
        </Text>
        <Text className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {isMock
            ? `${serviceProviders.backend.name} and ${serviceProviders.billing.name}: mock providers, no keys required.`
            : `${serviceProviders.backend.name} and ${serviceProviders.billing.name}: active in ${backendMode} / ${billingMode} mode.`}
        </Text>
        <Link href="/profile" asChild>
          <Button className="mt-6" variant="outline" label="Manage profile" />
        </Link>
      </View>
    </SafeAreaView>
  );
}
