import { AuthError } from '@/core/errors';

export type PasswordMode = 'sign-in' | 'sign-up' | 'link-account';

export function getEmailError(email: string): string | undefined {
  if (!email.trim()) {
    return 'Email is required.';
  }
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    return 'Enter a valid email address.';
  }
}

export function getPasswordError(password: string, mode: PasswordMode): string | undefined {
  if (!password) {
    return 'Password is required.';
  }
  if (mode !== 'sign-in' && password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof AuthError)) {
    return 'Something went wrong. Please try again.';
  }

  switch (error.code) {
    case 'invalid_credentials':
    case 'user_not_found':
      return 'Invalid email or password.';
    case 'invalid_email':
      return 'Enter a valid email address.';
    case 'user_already_exists':
      return 'An account with this email already exists.';
    case 'not_anonymous':
      return 'You already have an account.';
    case 'not_authenticated':
      return 'Sign in to continue.';
    case 'session_expired':
      return 'Your session expired. Please sign in again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
