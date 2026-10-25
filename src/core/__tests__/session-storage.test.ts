import { InMemorySessionStorage } from '../mocks/in-memory-session-storage';

const session = {
  token: 'token',
  user: { id: 'user', email: 'user@example.com', metadata: { role: 'developer' } },
};

describe('in-memory session storage', () => {
  it('persists and clears sessions', async () => {
    const storage = new InMemorySessionStorage();
    expect(await storage.getSession()).toBeNull();

    await storage.saveSession(session);
    expect(await storage.getSession()).toEqual(session);

    await storage.clearSession();
    expect(await storage.getSession()).toBeNull();
  });

  it('does not expose mutable stored state', async () => {
    const storage = new InMemorySessionStorage(session);
    const first = await storage.getSession();
    expect(first).not.toBeNull();
    if (!first) {
      throw new Error('Expected a stored session');
    }

    const mutable = first as unknown as { user: { metadata: { role: string } } };
    mutable.user.metadata.role = 'changed';
    expect((await storage.getSession())?.user.metadata).toEqual({ role: 'developer' });
  });
});
