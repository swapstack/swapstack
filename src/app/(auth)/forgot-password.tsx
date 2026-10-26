import { Link } from 'expo-router';
import * as React from 'react';

import { Button, Input } from '@/components/ui';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { FormMessage } from '@/features/auth/components/form-message';
import { useAuthSession } from '@/features/auth/session';
import { getEmailError, getErrorMessage } from '@/features/auth/validation';

export default function ForgotPasswordScreen() {
  const { auth } = useAuthSession();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState<string>();
  const [success, setSuccess] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(false);

  const submit = React.useCallback(async () => {
    const validationError = getEmailError(email);
    setError(validationError);
    setSuccess(undefined);
    if (validationError) {
      return;
    }

    setIsLoading(true);
    try {
      await auth.requestPasswordReset(email.trim());
      setSuccess('If an account exists for that email, reset instructions are on their way.');
    }
    catch (cause) {
      setError(getErrorMessage(cause));
    }
    finally {
      setIsLoading(false);
    }
  }, [auth, email]);

  return (
    <AuthScreen title="Reset your password" description="Enter your account email and we’ll send reset instructions.">
      <Input
        testID="reset-email-input"
        label="Email"
        value={email}
        onChangeText={setEmail}
        disabled={isLoading}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      {error && <FormMessage kind="error">{error}</FormMessage>}
      {success && <FormMessage kind="success">{success}</FormMessage>}
      <Button testID="reset-button" className="mt-4" label="Send reset instructions" loading={isLoading} onPress={submit} />
      <Link href="/login" className="mt-4 py-3 text-center text-sm text-neutral-600 dark:text-neutral-300">Back to sign in</Link>
    </AuthScreen>
  );
}
