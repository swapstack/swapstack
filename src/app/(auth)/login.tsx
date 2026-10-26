import { Link } from 'expo-router';
import * as React from 'react';

import { Button, Text, View } from '@/components/ui';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { EmailPasswordForm } from '@/features/auth/components/email-password-form';
import { FormMessage } from '@/features/auth/components/form-message';
import { useAuthSession } from '@/features/auth/session';
import { getErrorMessage } from '@/features/auth/validation';

export default function LoginScreen() {
  const { auth } = useAuthSession();
  const [isGuestLoading, setIsGuestLoading] = React.useState(false);
  const [guestError, setGuestError] = React.useState<string>();

  const continueAsGuest = React.useCallback(async () => {
    setIsGuestLoading(true);
    setGuestError(undefined);
    try {
      await auth.signInAnonymously();
    }
    catch (error) {
      setGuestError(getErrorMessage(error));
    }
    finally {
      setIsGuestLoading(false);
    }
  }, [auth]);

  return (
    <AuthScreen title="Welcome back" description="Sign in to continue to your account.">
      <EmailPasswordForm
        submitLabel="Sign in"
        onSubmit={async (credentials) => {
          await auth.signIn(credentials);
        }}
      />
      <View className="mt-4 flex-row justify-between">
        <Link href="/forgot-password" className="py-3 text-sm text-neutral-600 dark:text-neutral-300">Forgot password?</Link>
        <Link href="/sign-up" className="py-3 text-sm font-semibold">Create account</Link>
      </View>
      <View className="my-4 items-center">
        <Text className="text-sm text-neutral-500">or</Text>
      </View>
      {guestError && <FormMessage kind="error">{guestError}</FormMessage>}
      <Button
        testID="guest-button"
        variant="outline"
        label="Continue without account"
        loading={isGuestLoading}
        onPress={continueAsGuest}
      />
    </AuthScreen>
  );
}
