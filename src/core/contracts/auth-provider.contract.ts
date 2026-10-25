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

    it('signs up a user and establishes an active session', async () => {
      const session = await provider.signUp({
        email: 'newuser@swapstack.org',
        password: 'secretpassword',
        metadata: { role: 'developer' },
      });

      expect(session.user.email).toBe('newuser@swapstack.org');
      expect(session.user.metadata).toEqual({ role: 'developer' });

      const current = await provider.getSession();
      expect(current?.user.email).toBe('newuser@swapstack.org');
    });

    it('rejects signing up with an already registered email and sets error code', async () => {
      await provider.signUp({ email: 'duplicate@swapstack.org' });
      await expect(provider.signUp({ email: 'duplicate@swapstack.org' })).rejects.toMatchObject({
        code: 'user_already_exists',
      });
    });

    it('signs in an existing user and rejects an unknown user', async () => {
      await provider.signUp({ email: 'existing@swapstack.org' });
      await provider.signOut();

      const session = await provider.signIn({
        email: 'existing@swapstack.org',
        password: 'password123',
      });
      expect(session.user.email).toBe('existing@swapstack.org');

      await expect(provider.signIn({ email: 'unknown@swapstack.org' })).rejects.toMatchObject({
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
      await provider.signUp({ email: 'logout@swapstack.org' });
      expect(await provider.getSession()).not.toBeNull();

      await provider.signOut();
      expect(await provider.getSession()).toBeNull();
    });

    it('generates unique tokens on multiple sessions', async () => {
      const session1 = await provider.signUp({ email: 'user1@swapstack.org' });
      await provider.signOut();
      const session2 = await provider.signIn({ email: 'user1@swapstack.org' });
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

      const session = await provider.signUp({ email: 'listener@swapstack.org' });
      expect(listener).toHaveBeenCalledWith(session);

      await provider.signOut();
      expect(listener).toHaveBeenCalledWith(null);

      unsubscribe();
      await provider.signUp({ email: 'listener2@swapstack.org' });
      expect(listener).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('throws AuthError with invalid_email code when email is empty', async () => {
      await expect(provider.signIn({ email: '' })).rejects.toMatchObject({
        code: 'invalid_email',
      });
      await expect(provider.signUp({ email: '   ' })).rejects.toMatchObject({
        code: 'invalid_email',
      });
    });
  });
}
