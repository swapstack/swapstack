import type { SignInCredentials } from '@/core';
import * as React from 'react';
import { Button, Input } from '@/components/ui';
import { getEmailError, getErrorMessage, getPasswordError } from '../validation';
import { FormMessage } from './form-message';

export function EmailPasswordForm({
  submitLabel,
  onSubmit,
  initialEmail = '',
}: {
  readonly submitLabel: string;
  readonly onSubmit: (credentials: SignInCredentials) => Promise<void>;
  readonly initialEmail?: string;
}) {
  const [email, setEmail] = React.useState(initialEmail);
  const [password, setPassword] = React.useState('');
  const [emailError, setEmailError] = React.useState<string>();
  const [passwordError, setPasswordError] = React.useState<string>();
  const [error, setError] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(false);

  const submit = React.useCallback(async () => {
    const nextEmailError = getEmailError(email);
    const nextPasswordError = getPasswordError(password);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setError(undefined);
    if (nextEmailError || nextPasswordError) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({ email: email.trim(), password });
    }
    catch (cause) {
      setError(getErrorMessage(cause));
    }
    finally {
      setIsLoading(false);
    }
  }, [email, password, onSubmit]);

  return (
    <>
      <Input
        testID="email-input"
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={emailError}
        disabled={isLoading}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Input
        testID="password-input"
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={passwordError}
        disabled={isLoading}
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        secureTextEntry
      />
      {error && <FormMessage kind="error">{error}</FormMessage>}
      <Button
        testID="submit-button"
        className="mt-4"
        label={submitLabel}
        loading={isLoading}
        onPress={submit}
      />
    </>
  );
}
