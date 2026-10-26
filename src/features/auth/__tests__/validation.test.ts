import { AuthError } from '@/core/errors';
import { getErrorMessage } from '../validation';

describe('auth error messages', () => {
  it.each(['invalid_credentials', 'user_not_found'] as const)('hides account details for %s', (code) => {
    const error = new AuthError('private@example.com', code);
    expect(getErrorMessage(error)).toBe('Invalid email or password.');
    expect(getErrorMessage(error)).not.toContain('private@example.com');
  });

  it('uses a generic message for unknown errors', () => {
    expect(getErrorMessage(new Error('Sensitive provider details'))).toBe('Something went wrong. Please try again.');
  });
});
