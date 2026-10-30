import * as React from 'react';
import { Screen, Text, View } from '@/components/ui';

export function AuthScreen({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description: string;
  readonly children: React.ReactNode;
}) {
  return (
    <Screen scrollable contentContainerClassName="flex-grow justify-center px-6 py-8">
      <View className="w-full max-w-md self-center">
        <Text className="font-bold text-3xl">{title}</Text>
        <Text className="mt-2 mb-8 text-base text-neutral-600 dark:text-neutral-400">
          {description}
        </Text>
        {children}
      </View>
    </Screen>
  );
}
