import type { SignInCredentials } from '@/core';
import * as React from 'react';
import { Button, Input } from '@/components/ui';
import { getEmailError, getErrorMessage, getPasswordError } from '../validation';
import { FormMessage } from './form-message';

export function EmailPasswordForm({
  submitLabel,
  onSubmit,
  initialEmail = '',
  disabled = false,
  onLoadingChange,
}: {
  readonly submitLabel: string;
  readonly onSubmit: (credentials: SignInCredentials) => Promise<void>;
  readonly initialEmail?: string;
  readonly disabled?: boolean;
  readonly onLoadingChange?: (loading: boolean) => void;
}) {
  const [email, setEmail] = React.useState(initialEmail);
  const [password, setPassword] = React.useState('');
  const [emailError, setEmailError] = React.useState<string>();
  const [passwordError, setPasswordError] = React.useState<string>();
  const [error, setError] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(false);

  const setLoading = React.useCallback((loading: boolean) => {
    setIsLoading(loading);
    onLoadingChange?.(loading);
  }, [onLoadingChange]);

  const submit = React.useCallback(async () => {
    if (disabled || isLoading) {
      return;
    }
    const nextEmailError = getEmailError(email);
    const nextPasswordError = getPasswordError(password);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setError(undefined);
    if (nextEmailError || nextPasswordError) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ email: email.trim(), password });
    }
    catch (cause) {
      setError(getErrorMessage(cause));
    }
    finally {
      setLoading(false);
    }
  }, [disabled, isLoading, email, password, onSubmit, setLoading]);

  return (
    <>
      <Input
        testID="email-input"
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={emailError}
        disabled={disabled || isLoading}
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
        disabled={disabled || isLoading}
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
        disabled={disabled}
        onPress={submit}
      />
    </>
  );
}
