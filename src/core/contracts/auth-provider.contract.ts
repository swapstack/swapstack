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
      expect(await provider.getSession()).toBeNull();
    });

    it('handles immediate and confirmation-pending sign-up', async () => {
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
        expect((await provider.getSession())?.user.email).toBe('newuser@swapstack.org');
      }
    });

    it('rejects duplicate email registration', async () => {
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
      const session = await provider.signIn({ email: 'existing@swapstack.org', password: 'password123' });
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

    it('supports guest sessions', async () => {
      const session = await provider.signInAnonymously();
      expect(session.user.isAnonymous).toBe(true);
      expect(session.user.email).toBeUndefined();
      expect(await provider.getSession()).toEqual(session);
    });

    it('upgrades a guest to email credentials', async () => {
      await provider.signInAnonymously();
      const linked = await provider.linkAccount({
        email: 'linked@swapstack.org',
        password: 'secretpassword',
        metadata: { source: 'guest' },
      });

      if (linked === null) {
        expect(await provider.getSession()).toBeNull();
      }
      else {
        expect(linked.user.email).toBe('linked@swapstack.org');
        expect(linked.user.isAnonymous).toBe(false);
        expect(linked.user.metadata).toEqual({ source: 'guest' });
      }
    });

    it('rejects account linking for non-guest users', async () => {
      await provider.signInWithOAuth('apple');
      await expect(provider.linkAccount({ email: 'linked@swapstack.org', password: 'secretpassword' })).rejects.toMatchObject({
        code: 'not_anonymous',
      });
    });

    it('accepts password reset and verification requests', async () => {
      await expect(provider.requestPasswordReset('user@swapstack.org')).resolves.toBeUndefined();
      await expect(provider.resendVerification('user@swapstack.org')).resolves.toBeUndefined();
      await expect(provider.requestPasswordReset('')).rejects.toMatchObject({ code: 'invalid_email' });
      await expect(provider.resendVerification('')).rejects.toMatchObject({ code: 'invalid_email' });
    });

    it('updates the current user profile', async () => {
      await provider.signInAnonymously();
      const user = await provider.updateProfile({
        displayName: 'Swapstack User',
        metadata: { theme: 'dark' },
      });

      expect(user.displayName).toBe('Swapstack User');
      expect(user.metadata).toEqual({ theme: 'dark' });
      expect((await provider.getSession())?.user.displayName).toBe('Swapstack User');
    });

    it('deletes the current account and clears the session', async () => {
      await provider.signInAnonymously();
      await provider.deleteAccount();
      expect(await provider.getSession()).toBeNull();
      await expect(provider.updateProfile({ displayName: 'Deleted' })).rejects.toMatchObject({
        code: 'not_authenticated',
      });
    });

    it('refreshes the current session with a new token', async () => {
      const original = await provider.signInAnonymously();
      const refreshed = await provider.refreshSession();

      expect(refreshed).not.toBeNull();
      expect(refreshed?.token).not.toBe(original.token);
      expect(refreshed?.user.id).toBe(original.user.id);
    });

    it('signs out and clears the session', async () => {
      await provider.signInAnonymously();
      await provider.signOut();
      expect(await provider.getSession()).toBeNull();
    });

    it('generates unique tokens on multiple sessions', async () => {
      const session1 = await provider.signInAnonymously();
      await provider.signOut();
      const session2 = await provider.signInAnonymously();
      expect(session1.token).not.toBe(session2.token);
    });

    it('notifies listeners and supports unsubscribe', async () => {
      const listener = jest.fn();
      const failingListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener failure');
      });
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      provider.onAuthChange(failingListener);
      const unsubscribe = provider.onAuthChange(listener);

      const session = await provider.signInAnonymously();
      expect(listener).toHaveBeenCalledWith(session);
      await provider.signOut();
      expect(listener).toHaveBeenCalledWith(null);

      unsubscribe();
      await provider.signInAnonymously();
      expect(listener).toHaveBeenCalledTimes(2);
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
