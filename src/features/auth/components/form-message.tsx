import { Text } from '@/components/ui';

export function FormMessage({
  kind,
  children,
}: {
  readonly kind: 'error' | 'success';
  readonly children: string;
}) {
  return (
    <Text
      testID={`${kind}-message`}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={kind === 'error'
        ? 'my-2 text-sm text-danger-600 dark:text-danger-300'
        : 'my-2 text-sm text-green-600 dark:text-green-400'}
    >
      {children}
    </Text>
  );
}
