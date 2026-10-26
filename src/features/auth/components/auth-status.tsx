import { ActivityIndicator, Screen, Text } from '@/components/ui';

export function AuthStatus({ error }: { readonly error?: string | null }) {
  return (
    <Screen contentContainerClassName="items-center justify-center px-6">
      {error
        ? <Text className="text-center text-danger-600">{error}</Text>
        : <ActivityIndicator testID="auth-loading" />}
    </Screen>
  );
}
