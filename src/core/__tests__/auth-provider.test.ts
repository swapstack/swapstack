import { describeAuthProviderContract } from '../contracts/auth-provider.contract';
import { MockAuthProvider } from '../mocks/mock-auth-provider';

describe('mockAuthProvider Contract Suite', () => {
  describeAuthProviderContract(() => new MockAuthProvider());

  describe('implementation details', () => {
    it('generates unique user IDs that are not derived from the user email', async () => {
      const provider = new MockAuthProvider();
      const session1 = await provider.signUp({ email: 'alex@swapstack.org', password: 'secretpassword' });
      await provider.signOut();
      const session2 = await provider.signUp({ email: 'alex@otherdomain.com', password: 'secretpassword' });

      expect(session1).not.toBeNull();
      expect(session2).not.toBeNull();
      if (!session1 || !session2) {
        throw new Error('Mock sign-up should return a session');
      }
      expect(session1.user.id).not.toContain('alex');
      expect(session1.user.id).not.toContain('swapstack');
      expect(session2.user.id).not.toContain('otherdomain');
      expect(session1.user.id).not.toBe(session2.user.id);
    });

    it('returns null and clears the session when expiresAt has passed', async () => {
      const expiredSession = {
        token: 'expired_token',
        user: { id: 'u1', email: 'exp@swapstack.org', createdAt: new Date().toISOString() },
        expiresAt: Date.now() - 1000,
      };

      const listener = jest.fn();
      const provider = new MockAuthProvider(expiredSession);
      provider.onAuthChange(listener);

      expect(await provider.getSession()).toBeNull();
      expect(listener).toHaveBeenCalledWith(null);
      expect(await provider.getSession()).toBeNull();
    });

    it('does not expose mutable session or user state', async () => {
      const provider = new MockAuthProvider();
      const session = await provider.signUp({
        email: 'mutable@swapstack.org',
        password: 'secretpassword',
        metadata: { role: 'developer' },
      });

      expect(session).not.toBeNull();
      if (!session) {
        throw new Error('Mock sign-up should return a session');
      }
      const mutableSession = session as unknown as {
        token: string;
        user: { metadata: Record<string, unknown> };
      };
      mutableSession.user.metadata = { role: 'changed' };
      mutableSession.token = 'changed';

      const current = await provider.getSession();
      expect(current?.token).not.toBe('changed');
      expect(current?.user.metadata).toEqual({ role: 'developer' });
    });
  });
});
