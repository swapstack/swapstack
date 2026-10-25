import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-charcoal-950">
      <FocusAwareStatusBar />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-4xl font-bold">Swapstack</Text>
        <Text className="mt-3 text-center text-lg text-neutral-600 dark:text-neutral-300">
          A flexible Expo foundation for your next app.
        </Text>
      </View>
    </SafeAreaView>
  );
}
