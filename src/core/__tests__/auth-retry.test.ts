import { withAuthRetry } from '../auth-retry';
import { AuthError } from '../errors';

const session = {
  token: 'refreshed',
  user: { id: 'user', email: 'user@example.com' },
};

describe('auth retry', () => {
  it('refreshes once and retries a refreshable failure', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new AuthError('Expired', 'session_expired'))
      .mockResolvedValueOnce('success');
    const refresh = jest.fn().mockResolvedValue(session);

    expect(await withAuthRetry(operation, refresh)).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('does not retry non-refreshable failures', async () => {
    const error = new AuthError('Missing', 'user_not_found');
    const operation = jest.fn().mockRejectedValue(error);
    const refresh = jest.fn();

    await expect(withAuthRetry(operation, refresh)).rejects.toBe(error);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('does not retry again when refresh returns no session', async () => {
    const error = new AuthError('Expired', 'session_expired');
    const operation = jest.fn().mockRejectedValue(error);
    const refresh = jest.fn().mockResolvedValue(null);

    await expect(withAuthRetry(operation, refresh)).rejects.toBe(error);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
