import { describeAuthProviderContract } from '../contracts/auth-provider.contract';
import { MockAuthProvider } from '../mocks/mock-auth-provider';

describe('mockAuthProvider Contract Suite', () => {
  describeAuthProviderContract(() => new MockAuthProvider());

  describe('implementation details', () => {
    it('generates unique user IDs that are not derived from the user email', async () => {
      const provider = new MockAuthProvider();
      const email1 = 'alex@swapstack.org';
      const email2 = 'alex@otherdomain.com';

      const session1 = await provider.signUp({ email: email1 });
      await provider.signOut();
      const session2 = await provider.signUp({ email: email2 });

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

      const session = await provider.getSession();
      expect(session).toBeNull();
      expect(listener).toHaveBeenCalledWith(null);

      // Subsequent call also returns null
      expect(await provider.getSession()).toBeNull();
    });
  });
});
