import type { AuthProvider } from '../auth';

export function describeAuthProviderContract(
  createProvider: () => Promise<AuthProvider> | AuthProvider,
) {
  describe('AuthProvider contract', () => {
    let provider: AuthProvider;

    beforeEach(async () => {
      provider = await createProvider();
    });

    it('returns null session when not authenticated', async () => {
      const session = await provider.getSession();
      expect(session).toBeNull();
    });

    it('signs in a user and establishes an active session', async () => {
      const session = await provider.signIn({
        email: 'dev@swapstack.org',
        password: 'password123',
      });

      expect(session).toBeDefined();
      expect(session.user.email).toBe('dev@swapstack.org');
      expect(session.user.id).toBeTruthy();
      expect(session.token).toBeTruthy();

      const current = await provider.getSession();
      expect(current).toEqual(session);
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

    it('signs out and clears the session', async () => {
      await provider.signIn({ email: 'logout@swapstack.org' });
      expect(await provider.getSession()).not.toBeNull();

      await provider.signOut();
      expect(await provider.getSession()).toBeNull();
    });

    it('notifies listeners on auth state change and supports unsubscribe', async () => {
      const listener = jest.fn();
      const unsubscribe = provider.onAuthChange(listener);

      const session = await provider.signIn({ email: 'listener@swapstack.org' });
      expect(listener).toHaveBeenCalledWith(session);

      await provider.signOut();
      expect(listener).toHaveBeenCalledWith(null);

      unsubscribe();
      await provider.signIn({ email: 'listener2@swapstack.org' });
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('throws when signing in or up with an empty email', async () => {
      await expect(provider.signIn({ email: '' })).rejects.toThrow();
      await expect(provider.signUp({ email: '   ' })).rejects.toThrow();
    });
  });
}
