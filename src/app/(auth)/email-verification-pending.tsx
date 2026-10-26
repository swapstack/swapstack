import { Link, useLocalSearchParams } from 'expo-router';
import * as React from 'react';

import { Button, Text } from '@/components/ui';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { FormMessage } from '@/features/auth/components/form-message';
import { useAuthSession } from '@/features/auth/session';
import { getErrorMessage } from '@/features/auth/validation';

export default function EmailVerificationPendingScreen() {
  const { auth } = useAuthSession();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? '';
  const [error, setError] = React.useState<string>();
  const [success, setSuccess] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(false);

  const resend = React.useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      await auth.resendVerification(email);
      setSuccess('Verification email sent again.');
    }
    catch (cause) {
      setError(getErrorMessage(cause));
    }
    finally {
      setIsLoading(false);
    }
  }, [auth, email]);

  return (
    <AuthScreen title="Check your email" description={`Follow the verification link sent to ${email} to activate your account.`}>
      <Text className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">You can close this screen while you wait.</Text>
      {error && <FormMessage kind="error">{error}</FormMessage>}
      {success && <FormMessage kind="success">{success}</FormMessage>}
      <Button testID="resend-button" variant="outline" label="Resend verification email" loading={isLoading} onPress={resend} />
      <Link href="/login" className="mt-4 py-3 text-center text-sm text-neutral-600 dark:text-neutral-300">Back to sign in</Link>
    </AuthScreen>
  );
}
