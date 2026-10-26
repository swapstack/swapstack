import { ActivityIndicator, Button, Screen, Text } from '@/components/ui';

export function AuthStatus({
  error,
  onRetry,
}: {
  readonly error?: string | null;
  readonly onRetry?: () => void;
}) {
  return (
    <Screen contentContainerClassName="items-center justify-center px-6">
      {error
        ? (
            <>
              <Text className="mb-4 text-center text-danger-600 dark:text-danger-300">{error}</Text>
              {onRetry && <Button testID="session-retry-button" label="Try again" onPress={onRetry} />}
            </>
          )
        : <ActivityIndicator testID="auth-loading" />}
    </Screen>
  );
}
