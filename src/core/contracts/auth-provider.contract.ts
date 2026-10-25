/* eslint-disable max-lines-per-function */
import type { AuthProvider } from '../auth';

export function describeAuthProviderContract(
  createProvider: () => Promise<AuthProvider> | AuthProvider,
) {
  describe('auth provider contract', () => {
    let provider: AuthProvider;

    beforeEach(async () => {
      provider = await createProvider();
    });

    it('returns null session when not authenticated', async () => {
      const session = await provider.getSession();
      expect(session).toBeNull();
    });

    it('signs up a user and handles active or confirmation-pending states', async () => {
      const session = await provider.signUp({
        email: 'newuser@swapstack.org',
        password: 'secretpassword',
        metadata: { role: 'developer' },
      });

      if (session === null) {
        expect(await provider.getSession()).toBeNull();
      }
      else {
        expect(session.user.email).toBe('newuser@swapstack.org');
        expect(session.user.metadata).toEqual({ role: 'developer' });
        const current = await provider.getSession();
        expect(current?.user.email).toBe('newuser@swapstack.org');
      }
    });

    it('rejects signing up with an already registered email and sets error code', async () => {
      const credentials = { email: 'duplicate@swapstack.org', password: 'secretpassword' };
      await provider.signUp(credentials);
      await expect(provider.signUp(credentials)).rejects.toMatchObject({
        code: 'user_already_exists',
      });
    });

    it('signs in an existing user and rejects an unknown user', async () => {
      const enrolled = await provider.signUp({ email: 'existing@swapstack.org', password: 'password123' });
      if (enrolled === null) {
        expect(await provider.getSession()).toBeNull();
        return;
      }

      await provider.signOut();
      const session = await provider.signIn({
        email: 'existing@swapstack.org',
        password: 'password123',
      });
      expect(session.user.email).toBe('existing@swapstack.org');

      await expect(provider.signIn({ email: 'unknown@swapstack.org', password: 'password123' })).rejects.toMatchObject({
        code: 'user_not_found',
      });
    });

    it('signs in with OAuth providers', async () => {
      const appleSession = await provider.signInWithOAuth('apple');
      expect(appleSession.user.email).toContain('apple');
      expect(await provider.getSession()).toEqual(appleSession);

      const googleSession = await provider.signInWithOAuth('google');
      expect(googleSession.user.email).toContain('google');
      expect(await provider.getSession()).toEqual(googleSession);
    });

    it('signs out and clears the session', async () => {
      await provider.signUp({ email: 'logout@swapstack.org', password: 'secretpassword' });
      await provider.signOut();
      expect(await provider.getSession()).toBeNull();
    });

    it('generates unique tokens on multiple sessions', async () => {
      const session1 = await provider.signUp({ email: 'user1@swapstack.org', password: 'password123' });
      if (session1 === null) {
        expect(await provider.getSession()).toBeNull();
        return;
      }

      await provider.signOut();
      const session2 = await provider.signIn({ email: 'user1@swapstack.org', password: 'password123' });
      expect(session1.token).not.toBe(session2.token);
    });

    it('notifies listeners on auth state change and supports unsubscribe', async () => {
      const listener = jest.fn();
      const failingListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener failure');
      });

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      provider.onAuthChange(failingListener);
      const unsubscribe = provider.onAuthChange(listener);

      const session = await provider.signUp({ email: 'listener@swapstack.org', password: 'secretpassword' });
      if (session !== null) {
        expect(listener).toHaveBeenCalledWith(session);
      }

      await provider.signOut();
      expect(listener).toHaveBeenCalledWith(null);

      unsubscribe();
      await provider.signUp({ email: 'listener2@swapstack.org', password: 'secretpassword' });
      expect(listener).toHaveBeenCalledTimes(session === null ? 1 : 2);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('throws AuthError with invalid_email code when email is empty', async () => {
      await expect(provider.signIn({ email: '', password: 'secretpassword' })).rejects.toMatchObject({
        code: 'invalid_email',
      });
      await expect(provider.signUp({ email: '   ', password: 'secretpassword' })).rejects.toMatchObject({
        code: 'invalid_email',
      });
    });
  });
}
