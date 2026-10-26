export function getEmailError(email: string): string | undefined {
  if (!email.trim()) {
    return 'Email is required.';
  }
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    return 'Enter a valid email address.';
  }
}

export function getPasswordError(password: string): string | undefined {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
